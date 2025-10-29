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

// マップ定義（タイルの見た目用）
const START_POS = { col: 7, row: 5 }

// 下段(右→左) → 中段(左→右) → 上段(右→左)
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

// Player表示の位置計算用
const COLS = [12, 10.5, 9.5, 11.5, 9.5, 11.65, 9.5, 10.35, 12]
const ROWS = [18, 8, 18, 12, 18]
const PAD_X = 10
const PAD_TOP = 16
const PAD_BOTTOM = 7

export default function Game1() {
  const router = useRouter()
  const goalPushedRef = useRef(false)

  // タイル情報 (色やイベント種別)
  const { byId } = useEvents('/api/game/event1')
  const TOTAL_TILES = positions.length

  // ---- プレイヤー情報 ----
  // サーバー側の userID と合わせる
  const SELF_USER_ID = 'TestUser'

  // 現在どのマスにいるか (0 = スタート前, 1=最初のマス …)
  const [step, setStep] = useState(0)
  const cur = useMemo(
    () => (step === 0 ? START_POS : positions[step - 1]),
    [step]
  )

  // 所持金(HUD表示)
  const [money, setMoney] = useState<number>(10000)

  // ---- サイコロUIまわり ----
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] =
    useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)

  // ---- マス到着時のイベントUI ----
  // （既存の EVENT_BY_COLOR[*] コンポーネントで表示するやつ）
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)
  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  // ---- 「クライアント的には最終的にここに止まったはず」の期待値 ----
  // サーバーの公式位置(PLAYER_MOVED)と比較してズレ検出する用
  const [expectedFinalStep, setExpectedFinalStep] = useState<number | null>(null)

  // ---- WebSocketインスタンス ----
  const wsRef = useRef<GameSocketConnection | null>(null)

  // ログ: オーバーレイや出目の変化を追う
  useEffect(() => {
    console.log('[Game1] isDiceOpen changed:', isDiceOpen)
  }, [isDiceOpen])
  useEffect(() => {
    console.log('[Game1] lastDiceResult changed:', lastDiceResult)
  }, [lastDiceResult])

  // ---------- WebSocket接続 ----------
  useEffect(() => {
    console.log('[Game1] mounting: connectGameSocket()')

    wsRef.current = connectGameSocket({
      // サイコロ結果 (DICE_RESULT)
      onDiceResult: (userID, diceValue) => {
        console.log('[WS] onDiceResult:', { userID, diceValue })
        if (userID !== SELF_USER_ID) return

        const v = Math.max(1, Math.min(6, Math.floor(diceValue))) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6
        setLastDiceResult(v)
      },

      // サーバー公式の位置 (PLAYER_MOVED)
      onPlayerMoved: (userID, newPosition) => {
        console.log('[WS] onPlayerMoved:', { userID, newPosition })
        if (userID !== SELF_USER_ID) return

        setStep(newPosition)

        // クライアント期待値とのズレ確認
        if (expectedFinalStep !== null && expectedFinalStep !== newPosition) {
          console.warn('[WS] position mismatch!', {
            expectedFinalStep,
            serverStep: newPosition,
          })
        }

        setExpectedFinalStep(null)
      },

      // 所持金更新 (MONEY_CHANGED)
      onMoneyChanged: (userID, newMoney) => {
        console.log('[WS] onMoneyChanged:', { userID, newMoney })
        if (userID !== SELF_USER_ID) return
        setMoney(newMoney)
      },

      // 分岐マス (BRANCH_CHOICE_REQUIRED)
      onBranchChoiceRequired: (tileID, options) => {
        console.log('[WS] BRANCH_CHOICE_REQUIRED:', { tileID, options })
        // ← ここで分岐モーダルを開くコンポーネントを呼び出す想定
        // 今のページではUIを直接出さない
      },

      // クイズマス (QUIZ_REQUIRED)
      onQuizRequired: (tileID, quizData) => {
        console.log('[WS] QUIZ_REQUIRED:', { tileID, quizData })
        // ← クイズ用コンポーネント側にバケツリレーする想定
        // このページにはUIを書かない
      },

      // ギャンブル要求 (GAMBLE_REQUIRED)
      onGambleRequired: (tileID, referenceValue) => {
        console.log('[WS] GAMBLE_REQUIRED:', { tileID, referenceValue })
        // ← ギャンブル用コンポーネントを表示する想定
      },

      // ギャンブル結果 (GAMBLE_RESULT)
      onGambleResult: (
        userID,
        diceResult,
        choice,
        won,
        amount,
        newMoney
      ) => {
        console.log('[WS] GAMBLE_RESULT:', {
          userID,
          diceResult,
          choice,
          won,
          amount,
          newMoney,
        })
        if (userID === SELF_USER_ID) {
          setMoney(newMoney)
        }
      },

      // ゴール (PLAYER_FINISHED)
      onPlayerFinished: (userID, moneyAtGoal) => {
        console.log('[WS] PLAYER_FINISHED:', { userID, moneyAtGoal })
        // ← ランキングやリザルト画面につなぐ想定
      },

      // ステータス変化 (PLAYER_STATUS_CHANGED)
      onPlayerStatusChanged: (userID, status, value) => {
        console.log('[WS] PLAYER_STATUS_CHANGED:', {
          userID,
          status,
          value,
        })
        // ← HUDやプロフィールUIに反映する想定
      },

      // サーバーエラー
      onErrorMessage: (message) => {
        console.error('[WS] ERROR:', message)
        // ← トースト通知など
      },
    })

    return () => {
      console.log('[Game1] unmounting: close websocket')
      wsRef.current?.close()
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- プレイヤーを "nマス" 進める処理 ----------
  async function moveBy(stepsToMove: number) {
    console.log('[Game1] moveBy called stepsToMove=', stepsToMove)

    if (isMoving || activeEventColor) {
      console.log('[Game1] moveBy: cannot move (isMoving or activeEventColor)')
      return
    }
    if (step >= TOTAL_TILES) {
      console.log('[Game1] moveBy: already at/after goal')
      return
    }

    setIsMoving(true)

    let pos = step
    for (let i = 0; i < stepsToMove; i++) {
      if (pos >= TOTAL_TILES) break
      pos += 1
      console.log('[Game1] moving... pos=', pos)
      setStep(pos)
      await new Promise((r) => setTimeout(r, 250)) // 歩くようなアニメ間隔
      if (pos === TOTAL_TILES) break
    }

    setIsMoving(false)
    console.log('[Game1] moveBy done. final pos=', pos)

    // 「クライアント的にはここに止まったはず」を覚えておく
    setExpectedFinalStep(pos)

    // タイル到着イベント（既存の EVENT_BY_COLOR によるモーダル表示）
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

  // ---------- 「サイコロを振る」ボタン ----------
  function handleRollClick() {
    console.log('[Game1] handleRollClick')

    if (isMoving || !!activeEventColor) {
      console.log('[Game1] roll: blocked (moving/event modal)')
      return
    }

    // サイコロオーバーレイを開く
    setIsDiceOpen(true)

    // 前の結果をリセット
    setLastDiceResult(null)
    setExpectedFinalStep(null)

    console.log('[Game1] sendRollDice()')
    wsRef.current?.sendRollDice()
  }

  // ---------- サイコロ「マップに戻る」押下 ----------
  function handleDiceConfirm() {
    console.log('[Game1] handleDiceConfirm lastDiceResult=', lastDiceResult)
    if (lastDiceResult != null) {
      moveBy(lastDiceResult)
    }
    setIsDiceOpen(false)
  }

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        {/* 背景 */}
        <Image
          src="/back1.png"
          alt=""
          fill
          className="object-cover z-0 pointer-events-none opacity-70"
          aria-hidden
          priority
          sizes="100vw"
        />

        {/* HUD（お金など） */}
        <GameHUD
          money={money}
          remaining={50}
          className="w-full absolute top-[3%] left-[3%]"
        />

        {/* 設定ボタン */}
        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
        </div>

        {/* スタート表示 */}
        <div className="absolute bottom-[10%] sm:bottom-[12%] right-[18%] rounded-md bg-brown-default/90 text-white border-2 border-white px-4 py-2 md:py-8 md:px-12 font-bold text-xl md:text-3xl">
          スタート
        </div>

        {/* サイコロボタン */}
        <DiceButton
          onClick={handleRollClick}
          disabled={isMoving || !!activeEventColor}
          className="absolute right-[3%] bottom-[3%] z-10"
        />

        {/* サイコロ演出オーバーレイ */}
        <DiceOverlay
          isOpen={isDiceOpen}
          diceResult={lastDiceResult}
          onClose={() => {
            console.log('[Game1] DiceOverlay onClose')
            setIsDiceOpen(false)
          }}
          onConfirm={handleDiceConfirm}
        />

        {/* マップ（タイル並べ） */}
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

        {/* マス固有イベントのモーダル（既存のEVENT_BY_COLORを使うやつ） */}
        {EventComp && (
          <EventComp
            onClose={() => {
              console.log(
                '[Game1] EventComp onClose (activeEventColor=',
                activeEventColor,
                ')'
              )
              setActiveEventColor(null)

              if (goalAwaitingEventClose && !goalPushedRef.current) {
                goalPushedRef.current = true
                setGoalAwaitingEventClose(false)
                router.push('/game/2/a')
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
