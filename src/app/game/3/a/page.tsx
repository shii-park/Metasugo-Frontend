 'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

// Firebase 認証
import { auth } from '@/firebase'
import {
  User as FirebaseUser,
  getIdToken,
  onAuthStateChanged,
} from 'firebase/auth'

// UI/ゲーム周辺
import type { EventType } from '@/app/api/game/type'
import { EVENT_BY_COLOR } from '@/components/events'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import Player from '@/components/game/Player'
import SettingsMenu from '@/components/game/SettingMenu'
import Status from '@/components/game/Status'
import Tile from '@/components/game/Tile'

// ロジック
import { colorClassOfEvent } from '@/lib/game/eventColor'
import { kindToEventType } from '@/lib/game/kindMap'
import { useGameStore } from '@/lib/game/store'
import { useTiles } from '@/lib/game/useTiles'
import {
  connectGameSocket,
  GameSocketConnection,
  QuizData,
} from '@/lib/game/wsClient'

// --- レイアウト（3a） ---
const START_POS = { col: 7, row: 5 } // 装飾位置（スタート表記など）
const positions = [
  { col: 7, row: 5 }, { col: 5, row: 5 }, { col: 3, row: 5 }, { col: 1, row: 5 },
  { col: 1, row: 3 }, { col: 3, row: 3 }, { col: 5, row: 3 }, { col: 7, row: 3 }, { col: 9, row: 3 },
  { col: 9, row: 1 }, { col: 7, row: 1 }, { col: 5, row: 1 }, { col: 3, row: 1 }, { col: 1, row: 1 },
]
const COLS = [12, 10.5, 9.5, 11.5, 9.5, 11.65, 9.5, 10.35, 12]
const ROWS = [18, 8, 18, 12, 18]
const PAD_X = 10
const PAD_TOP = 16
const PAD_BOTTOM = 7

export default function Game3a() {
  const router = useRouter()
  const goalPushedRef = useRef(false)

  // 認証
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)

  // タイル（バックエンドから取得）
  const {
    byId: tileById,
    tiles,
    loading: tilesLoading,
    error: tilesError,
  } = useTiles()

  useEffect(() => {
    console.log('[Game3a] useTiles:', { tilesLoading, tilesError })
  }, [tilesLoading, tilesError])

  const TOTAL_TILES = Math.min(positions.length, tiles?.length ?? positions.length)

  // 進行状態
  const [step, setStep] = useState(0)
  const [, setServerTileID] = useState<number | null>(null)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)

  // イベント表示
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [currentEventDetail, setCurrentEventDetail] = useState<string | null>(null)
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)
  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  // 所持金（Gamble/Money +/- 用）
  const [money, setMoney] = useState<number>(1000000)

  const [, setExpectedFinalStep] = useState<number | null>(null)
  const [, setBranchChoice] = useState<{ tileID: number; options: number[] } | null>(null)
  const wsRef = useRef<GameSocketConnection | null>(null)

  const cur = useMemo(() => (step === 0 ? START_POS : positions[step - 1]), [step])

  // --- 認証監視 ---
  useEffect(() => {
    const un = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user)
      } else {
        setAuthUser(null)
        wsRef.current?.close()
        wsRef.current = null
      }
    })
    return () => un()
  }, [])

  // --- WS接続（Game1/2と同様） ---
  useEffect(() => {
    if (authUser && !wsRef.current) {
      getIdToken(authUser)
        .then((token) => {
          const handlers = {
            onDiceResult: (userID: string, diceValue: number) => {
              if (!authUser || userID !== authUser.uid) return
              const v = Math.max(1, Math.min(6, Math.floor(diceValue))) as 1 | 2 | 3 | 4 | 5 | 6
              setLastDiceResult(v)
            },
            onQuizRequired: (tileID: number, quizData: QuizData) => {
              useGameStore.getState().setQuizReq({ tileID, quizData })
            },
            onMoneyChanged: (userID: string, newMoney: number) => {
              if (!authUser || userID !== authUser.uid) return
              setMoney((prev) => {
                const delta = newMoney - prev
                if (delta !== 0) useGameStore.getState().setMoneyChange({ delta })
                return newMoney
              })
            },
            onGambleResult: (_u: string, _d: number, _c: 'High' | 'Low', _w: boolean, _amt: number, newMoney: number) => {
              setMoney(newMoney)
            },
            onPlayerMoved: (userID: string, newPosition: number) => {
              if (!authUser || userID !== authUser.uid) return
              setServerTileID(newPosition)
            },
            onBranchChoiceRequired: (tileID: number, options: number[]) => {
              setBranchChoice({ tileID, options })
            },
            onPlayerFinished: (userID: string) => {
              if (!authUser || userID !== authUser.uid) return
              try { wsRef.current?.close() } finally { wsRef.current = null }
            },
          } as const

          wsRef.current = connectGameSocket(handlers, token)
        })
        .catch((e) => console.error('[Game3a] WS connect failed:', e))
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [authUser])

  // --- タイル効果（即反映） ---
  function runTileEffect(tileId: number) {
    const tile = tileById.get(tileId)
    if (!tile) return
    const ef = tile.effect as { type?: string; amount?: number } | undefined
    if (!ef || !ef.type) return

    if (ef.type === 'profit') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt) {
        useGameStore.getState().setMoneyChange({ delta: amt })
        setMoney((p) => p + amt)
      }
    } else if (ef.type === 'loss') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt) {
        useGameStore.getState().setMoneyChange({ delta: -amt })
        setMoney((p) => p - amt)
      }
    }
  }

  // --- 前進（アニメ → 効果 → イベント） ---
  async function moveBy(stepsToMove: number) {
    if (isMoving || activeEventColor) return
    if (step >= TOTAL_TILES) return

    setIsMoving(true)
    let pos = step
    for (let i = 0; i < stepsToMove; i++) {
      if (pos >= TOTAL_TILES) break
      pos += 1
      setStep(pos)
      await new Promise((r) => setTimeout(r, 250))
      if (pos === TOTAL_TILES) break
    }
    setIsMoving(false)
    setExpectedFinalStep(pos)

    if (pos > 0 && pos <= TOTAL_TILES) runTileEffect(pos)

    if (pos > 0 && pos <= TOTAL_TILES) {
      const isGoal = pos === TOTAL_TILES
      const GOAL_EVENT_TYPE: EventType = 'branch' // ゴール時は分岐扱い（任意）
      const currentTile = tileById.get(pos)
      const tileDetail = currentTile?.detail ?? ''
      const tileEventType: EventType | undefined =
        isGoal ? GOAL_EVENT_TYPE : kindToEventType(currentTile?.kind)
      const color = colorClassOfEvent(tileEventType)

      if (color && EVENT_BY_COLOR[color]) {
        setActiveEventColor(color)
        if (tileEventType === 'overall' || tileEventType === 'neighbor') {
          setCurrentEventDetail(tileDetail)
        }
        if (isGoal) setGoalAwaitingEventClose(true)
      } else {
        setCurrentEventDetail(null)
      }
    }
  }

  // --- サイコロ ---
  function handleRollClick() {
    if (isMoving || !!activeEventColor || !authUser) return
    if (!wsRef.current) return
    setIsDiceOpen(true)
    setLastDiceResult(null)
    setExpectedFinalStep(null)
    wsRef.current.sendRollDice()
  }
  function handleDiceConfirm() {
    if (lastDiceResult != null) moveBy(lastDiceResult)
    setIsDiceOpen(false)
  }

  // 色（useTiles→kind→EventType→color）
  const colorOf = (id: number) =>
    colorClassOfEvent(kindToEventType(tileById.get(id)?.kind))

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        <Image
          src="/back3.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover z-0 pointer-events-none opacity-70"
          aria-hidden
          priority
        />

        {/* ヘッダ/HUD */}
        <GameHUD
          money={money}
          remaining={TOTAL_TILES - step}
          className="w-full absolute top-[3%] left-[3%]"
        />
        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
        </div>
        <div className="absolute top-[15%] left-[3%] z-10">
          <Status />
        </div>

        {/* サイコロ */}
        <DiceButton
          onClick={handleRollClick}
          disabled={isMoving || !!activeEventColor || !authUser}
          className="absolute right-[3%] bottom-[3%] z-10"
        />
        <DiceOverlay
          isOpen={isDiceOpen}
          diceResult={lastDiceResult}
          onClose={() => setIsDiceOpen(false)}
          onConfirm={handleDiceConfirm}
        />

        {/* タイル配置 */}
        <div
          className="absolute inset-0 grid grid-cols-9 grid-rows-5 px-[10%] pt-[9.5%] pb-[7%]"
          style={{
            gridTemplateColumns:
              '9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5%',
            gridTemplateRows: '18% 20% 18% 26% 18%',
          }}
        >
          <Tile col={7} row={5} colorClass={colorOf(1)} />
          <Tile col={5} row={5} colorClass={colorOf(2)} />
          <Tile col={3} row={5} colorClass={colorOf(3)} />
          <Tile col={1} row={5} colorClass={colorOf(4)} />

          <Tile col={1} row={3} colorClass={colorOf(5)} />
          <Tile col={3} row={3} colorClass={colorOf(6)} />
          <Tile col={5} row={3} colorClass={colorOf(7)} />
          <Tile col={7} row={3} colorClass={colorOf(8)} />
          <Tile col={9} row={3} colorClass={colorOf(9)} />

          <Tile col={9} row={1} colorClass={colorOf(10)} />
          <Tile col={7} row={1} colorClass={colorOf(11)} />
          <Tile col={5} row={1} colorClass={colorOf(12)} />
          <Tile col={3} row={1} colorClass={colorOf(13)} />
          <Tile col={1} row={1} colorClass={colorOf(14)} />
        </div>

        {/* プレイヤー */}
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

        {/* イベントモーダル */}
        {EventComp && (
          <EventComp
            currentMoney={money}
            onUpdateMoney={setMoney}
            eventMessage={currentEventDetail ?? ''}
            onClose={() => {
              setActiveEventColor(null)
              setCurrentEventDetail(null)
              useGameStore.getState().clearMoneyChange()
              useGameStore.getState().clearNeighborReq()

              if (goalAwaitingEventClose && !goalPushedRef.current) {
                goalPushedRef.current = true
                setGoalAwaitingEventClose(false)
                router.push('/game/4/a') // ← ゴール後（必要に応じて変更）
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
