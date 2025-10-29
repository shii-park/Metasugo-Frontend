'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { EventType } from '@/app/api/game/type'
import { EVENT_BY_COLOR } from '@/components/events'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import Player from '@/components/game/Player'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'

import { colorClassOfEvent } from '@/lib/game/eventColor'
import { useEvents } from '@/lib/game/useEvents'
import {
  connectGameSocket,
  GameSocketConnection,
} from '@/lib/game/wsClient'

const START_POS = { col: 7, row: 5 }

const positions = [
  { col: 5, row: 5 },
  { col: 3, row: 5 },
  { col: 1, row: 5 },
  { col: 1, row: 3 },
  { col: 3, row: 3 },
  { col: 5, row: 3 },
  { col: 7, row: 3 },
  { col: 9, row: 3 },
  { col: 9, row: 1 },
  { col: 7, row: 1 },
  { col: 5, row: 1 },
  { col: 3, row: 1 },
  { col: 1, row: 1 },
]

const COLS = [12, 10.5, 9.5, 11.5, 9.5, 11.65, 9.5, 10.35, 12]
const ROWS = [18, 8, 18, 12, 18]
const PAD_X = 10
const PAD_TOP = 16
const PAD_BOTTOM = 7

export default function Game1() {
  const router = useRouter()
  const goalPushedRef = useRef(false)

  const { byId } = useEvents('/api/game/event1')
  const TOTAL_TILES = positions.length

  // 仮の自分のID（サーバー側もこれで識別してくれる想定）
  const SELF_USER_ID = 'TestUser'

  // 現在のマス（0 = スタート）
  const [step, setStep] = useState(0)
  const cur = useMemo(() => (step === 0 ? START_POS : positions[step - 1]), [step])

  // サイコロUIまわり
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] =
    useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)

  // マスのイベントUI
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)
  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  // 「この位置にいるはず」というフロントの期待値
  const [expectedFinalStep, setExpectedFinalStep] = useState<number | null>(null)

  // 分岐マスの情報
  const [branchChoice, setBranchChoice] = useState<{
    tileID: number
    options: number[]
  } | null>(null)

  // WebSocketハンドル
  const wsRef = useRef<GameSocketConnection | null>(null)

  // ===== デバッグログ: オーバーレイや出目の変化を追跡 =====
  useEffect(() => {
    console.log('[Game1] isDiceOpen changed:', isDiceOpen)
  }, [isDiceOpen])

  useEffect(() => {
    console.log('[Game1] lastDiceResult changed:', lastDiceResult)
  }, [lastDiceResult])

  // ===== WebSocket接続 =====
  useEffect(() => {
    console.log('[Game1] mounting, connectGameSocket()呼ぶよ')

    wsRef.current = connectGameSocket({
      onDiceResult: (userID, diceValue) => {
        console.log('[WS] onDiceResult raw:', { userID, diceValue })
        if (userID !== SELF_USER_ID) {
          console.log('[WS] onDiceResult: 他人の結果なので無視')
          return
        }
        const v = Math.max(1, Math.min(6, Math.floor(diceValue))) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6
        console.log('[WS] onDiceResult normalized => setLastDiceResult(', v, ')')
        setLastDiceResult(v)
      },

      onPlayerMoved: (userID, newPosition) => {
        console.log('[WS] onPlayerMoved:', { userID, newPosition })
        if (userID !== SELF_USER_ID) return
        setStep(newPosition)

        if (expectedFinalStep !== null && expectedFinalStep !== newPosition) {
          console.warn('[WS] position mismatch!', {
            expectedFinalStep,
            serverStep: newPosition,
          })
        }
        setExpectedFinalStep(null)
      },

      onBranchChoiceRequired: (tileID, options) => {
        console.log('[WS] onBranchChoiceRequired:', { tileID, options })
        setBranchChoice({ tileID, options })
      },
    })

    return () => {
      console.log('[Game1] unmounting, wsRef.current?.close()呼ぶよ')
      wsRef.current?.close()
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== コマを進める =====
  async function moveBy(stepsToMove: number) {
    console.log('[Game1] moveBy called with stepsToMove=', stepsToMove)

    if (isMoving || activeEventColor) {
      console.log('[Game1] moveBy: いまは動けない (isMoving or activeEventColor)')
      return
    }
    if (step >= TOTAL_TILES) {
      console.log('[Game1] moveBy: もうゴール以降なので動かない')
      return
    }

    setIsMoving(true)

    let pos = step
    for (let i = 0; i < stepsToMove; i++) {
      if (pos >= TOTAL_TILES) break
      pos += 1
      console.log('[Game1] step進行中 =>', pos)
      setStep(pos)
      await new Promise((r) => setTimeout(r, 250))
      if (pos === TOTAL_TILES) break
    }

    setIsMoving(false)
    console.log('[Game1] moveBy: 終了時 pos=', pos)
    setExpectedFinalStep(pos)

    // イベント発火
    if (pos > 0 && pos <= TOTAL_TILES) {
      const isGoal = pos === TOTAL_TILES
      const GOAL_EVENT_TYPE: EventType = 'branch'
      const tileEventType: EventType | undefined = isGoal
        ? GOAL_EVENT_TYPE
        : byId.get(pos)?.type

      const color = colorClassOfEvent(tileEventType)
      console.log('[Game1] tileEventType=', tileEventType, 'color=', color)

      if (color && EVENT_BY_COLOR[color]) {
        setActiveEventColor(color)
        if (isGoal) {
          setGoalAwaitingEventClose(true)
        }
      }
    }
  }

  // ===== サイコロボタン押下 =====
  function handleRollClick() {
    console.log('[Game1] handleRollClick')
    if (isMoving || !!activeEventColor) {
      console.log('[Game1] roll: 動いてる/イベント中なので不可')
      return
    }

    // オーバーレイを開く
    setIsDiceOpen(true)

    // 前回の結果リセット
    setLastDiceResult(null)
    setExpectedFinalStep(null)

    console.log('[Game1] ROLL_DICE send → wsRef.current?.sendRollDice()')
    wsRef.current?.sendRollDice()
  }

  // ===== サイコロ「マップに戻る」 =====
  function handleDiceConfirm() {
    console.log('[Game1] handleDiceConfirm lastDiceResult=', lastDiceResult)
    if (lastDiceResult != null) {
      moveBy(lastDiceResult)
    }
    setIsDiceOpen(false)
  }

  // ===== 分岐選択 =====
  function handleChooseBranch(selectionTileID: number) {
    console.log('[Game1] handleChooseBranch selectionTileID=', selectionTileID)
    wsRef.current?.sendSubmitChoice(selectionTileID)
    setBranchChoice(null)
  }

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        <Image
          src="/back1.png"
          alt=""
          fill
          className="object-cover z-0 pointer-events-none opacity-70"
          aria-hidden
          priority
          sizes="100vw"
        />

        <GameHUD
          money={10000}
          remaining={50}
          className="w-full absolute top-[3%] left-[3%]"
        />

        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
        </div>

        <div className="absolute bottom-[10%] sm:bottom-[12%] right-[18%] rounded-md bg-brown-default/90 text-white border-2 border-white px-4 py-2 md:py-8 md:px-12 font-bold text-xl md:text-3xl">
          スタート
        </div>

        <DiceButton
          onClick={handleRollClick}
          disabled={isMoving || !!activeEventColor}
          className="absolute right-[3%] bottom-[3%] z-10"
        />

        <DiceOverlay
          isOpen={isDiceOpen}
          diceResult={lastDiceResult}
          onClose={() => {
            console.log('[Game1] DiceOverlay onClose')
            setIsDiceOpen(false)
          }}
          onConfirm={handleDiceConfirm}
        />

        {/* マップ */}
        <div
          className="absolute inset-0 grid grid-cols-9 grid-rows-5 px-[10%] pt-[9.5%] pb-[7%]"
          style={{
            gridTemplateColumns:
              '9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5%',
            gridTemplateRows: '18% 20% 18% 26% 18%',
          }}
        >
          <Tile col={5} row={5} colorClass={colorClassOfEvent(byId.get(1)?.type)} className="w-full h-full" />
          <Tile col={3} row={5} colorClass={colorClassOfEvent(byId.get(2)?.type)} className="w-full h-full" />
          <Tile col={1} row={5} colorClass={colorClassOfEvent(byId.get(3)?.type)} className="w-full h-full" />

          <Tile col={1} row={3} colorClass={colorClassOfEvent(byId.get(4)?.type)} className="w-full h-full" />
          <Tile col={3} row={3} colorClass={colorClassOfEvent(byId.get(5)?.type)} className="w-full h-full" />
          <Tile col={5} row={3} colorClass={colorClassOfEvent(byId.get(6)?.type)} className="w-full h-full" />
          <Tile col={7} row={3} colorClass={colorClassOfEvent(byId.get(7)?.type)} className="w-full h-full" />
          <Tile col={9} row={3} colorClass={colorClassOfEvent(byId.get(8)?.type)} className="w-full h-full" />

          <Tile col={9} row={1} colorClass={colorClassOfEvent(byId.get(9)?.type)} className="w-full h-full" />
          <Tile col={7} row={1} colorClass={colorClassOfEvent(byId.get(10)?.type)} className="w-full h-full" />
          <Tile col={5} row={1} colorClass={colorClassOfEvent(byId.get(11)?.type)} className="w-full h-full" />
          <Tile col={3} row={1} colorClass={colorClassOfEvent(byId.get(12)?.type)} className="w-full h-full" />
          <Tile col={1} row={1} colorClass={colorClassOfEvent(byId.get(13)?.type)} className="w-full h-full" />
        </div>

        {/* プレイヤー駒 */}
        <Player
          col={cur.col}
          row={cur.row}
          colsPct={COLS}
          rowsPct={ROWS}
          padXPct={PAD_X}
          padTopPct={PAD_TOP}
          padBottomPct={PAD_BOTTOM}
          label="あなた"
          imgSrc="/player1.png"
        />

        {/* イベントモーダル（ゴール演出など） */}
        {EventComp && (
          <EventComp
            onClose={() => {
              console.log('[Game1] EventComp onClose (activeEventColor=', activeEventColor, ')')
              setActiveEventColor(null)
              if (goalAwaitingEventClose && !goalPushedRef.current) {
                goalPushedRef.current = true
                setGoalAwaitingEventClose(false)
                router.push('/game/2/a')
              }
            }}
          />
        )}

        {/* 分岐用の仮UI */}
        {branchChoice && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 text-white">
            <div className="bg-brown-default border-2 border-white p-4 rounded-md text-center">
              <div className="font-bold mb-2">
                分岐マス {branchChoice.tileID}！どっちに進む？
              </div>
              <div className="flex flex-col gap-2">
                {branchChoice.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChooseBranch(opt)}
                    className="px-4 py-2 rounded bg-blue-default text-white font-bold"
                  >
                    タイル {opt} に進む
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
