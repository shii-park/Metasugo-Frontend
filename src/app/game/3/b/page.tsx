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
import { useTiles, type Tile as TileType } from '@/lib/game/useTiles'
import {
  connectGameSocket,
  GameSocketConnection,
  QuizData,
} from '@/lib/game/wsClient'

// --- レイアウト（3b） ---
const START_POS = { col: 7, row: 5 }
const positions = [
  // 下段 L→R (4)
  { col: 7, row: 5 }, { col: 5, row: 5 }, { col: 3, row: 5 }, { col: 1, row: 5 },
  // 中段 R→L (5)
  { col: 1, row: 3 }, { col: 3, row: 3 }, { col: 5, row: 3 }, { col: 7, row: 3 }, { col: 9, row: 3 },
  // 上段 L→R (5)
  { col: 9, row: 1 }, { col: 7, row: 1 }, { col: 5, row: 1 }, { col: 3, row: 1 }, { col: 1, row: 1 },
]
const COLS = [12, 10.5, 9.5, 11.5, 9.5, 11.65, 9.5, 10.35, 12]
const ROWS = [18, 8, 18, 12, 18]
const PAD_X = 10
const PAD_TOP = 16
const PAD_BOTTOM = 7

/* ===========================================================
 * この盤面で使用する tiles.json 側の ID を positions の順に対応付け
 * （色決定・イベント発火の両方でこの配列を必ず経由する）
 * =========================================================== */
const TILE_IDS = [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 52] as const
const tileIdAt = (pos: number) => TILE_IDS[pos - 1] // pos: 1..12

/** このページの「最後のマス」で強制するイベント種別 */
const FORCE_LAST_EVENT: EventType = 'branch'

/** effect.type を優先して EventType を判定（無い場合は kind からフォールバック） */
function eventTypeOfTile(tile?: TileType): EventType | undefined {
  if (!tile) return undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (tile?.effect as any)?.type as string | undefined
  switch (t) {
    case 'profit':
    case 'loss':
    case 'quiz':
    case 'branch':
    case 'gamble':
    case 'overall':
    case 'neighbor':
    case 'require':
    case 'goal':
    case 'conditional':
    case 'setStatus':
    case 'childBonus':
      return t as EventType
  }
  return kindToEventType(tile?.kind)
}

export default function Game3b() {
  const router = useRouter()
  const goalPushedRef = useRef(false)

  // 認証
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)

  // タイル（バックエンド）
  const {
    byId: tileById,
    tiles,
    loading: tilesLoading,
    error: tilesError,
  } = useTiles()

  useEffect(() => {
    console.log('[Game3b] useTiles:', { tilesLoading, tilesError })
  }, [tilesLoading, tilesError])

  const TOTAL_TILES = Math.min(positions.length, tiles?.length ?? positions.length)

  // 進行
  const [step, setStep] = useState(0)
  const [, setServerTileID] = useState<number | null>(null)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)

  // イベントUI
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [currentEventDetail, setCurrentEventDetail] = useState<string | null>(null)
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)
  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  // 所持金
  const [money, setMoney] = useState<number>(1000000)

  const [, setExpectedFinalStep] = useState<number | null>(null)
  const [, setBranchChoice] = useState<{ tileID: number; options: number[] } | null>(null)
  const wsRef = useRef<GameSocketConnection | null>(null)

  const cur = useMemo(() => (step === 0 ? START_POS : positions[step - 1]), [step])

  /** 盤面 index（1..12）から色クラスを返す。最後は強制イベントを適用 */
  const colorOfPos = (posIndex: number) => {
    const id = tileIdAt(posIndex)
    const isLast = posIndex === TOTAL_TILES
    const ev = isLast ? FORCE_LAST_EVENT : eventTypeOfTile(tileById.get(id))
    return colorClassOfEvent(ev)
  }

  // 認証監視
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

  // WS接続
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
        .catch((e) => console.error('[Game3b] WS connect failed:', e))
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [authUser])

  // タイル効果
  function runTileEffectByTileId(tileId: number) {
    const tile = tileById.get(tileId)
    if (!tile) return
    const ef = tile.effect as { type?: string; amount?: number } | undefined
    if (!ef?.type) return

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

  // 前進
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

    if (pos > 0 && pos <= TOTAL_TILES) {
      if (pos > 0 && pos <= TOTAL_TILES) {
        const tileId = tileIdAt(pos)
        runTileEffectByTileId(tileId)
        const isLast = pos === TOTAL_TILES
        const currentTile = tileById.get(tileId)

        // ★ 最後は必ず Branch にする（このページ仕様）
        const forced: EventType | undefined = isLast ? FORCE_LAST_EVENT : undefined
        const tileEventType: EventType | undefined = forced ?? eventTypeOfTile(currentTile)
        const color = colorClassOfEvent(tileEventType)

        setActiveEventColor(color ?? null)
        setCurrentEventDetail(
          tileEventType === 'overall' || tileEventType === 'neighbor'
            ? (currentTile?.detail ?? '')
            : null,
        )
        // ★ Branch は自前で遷移するため、自動遷移フラグは goal のときのみ
        setGoalAwaitingEventClose(tileEventType === 'goal')
      }
    }
  }

  // サイコロ
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

  // 色
  const colorOf = (id: number) =>
    colorClassOfEvent(kindToEventType(tileById.get(id)?.kind))

  useEffect(() => {
    if (authUser && wsRef.current && !tilesLoading && step === 0) {
      const timer = setTimeout(async () => {
        await moveBy(1)
        setTimeout(() => {
          setIsMoving(false)
        }, 100)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [authUser, wsRef.current, tilesLoading])

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

        {/* HUD */}
        <GameHUD
          money={money}
          remaining={TOTAL_TILES - step}
          className="w-full absolute top-[3%] left-[3%]"
        />
        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
        </div>
        {/* <div className="absolute top-[15%] left-[3%] z-10">
          <Status />
        </div> */}

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

        {/* タイル配置：色決定も pos→id 経由で統一（最後は Branch を強制） */}
        <div
          className="absolute inset-0 grid grid-cols-9 grid-rows-5 px-[10%] pt-[9.5%] pb-[7%]"
          style={{
            gridTemplateColumns:
              '9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5%',
            gridTemplateRows: '18% 20% 18% 26% 18%',
          }}
        >
          {/* 下段 1..4 */}
          <Tile col={7} row={5} colorClass={colorOfPos(1)} className="w-full h-full" />
          <Tile col={5} row={5} colorClass={colorOfPos(2)} className="w-full h-full" />
          <Tile col={3} row={5} colorClass={colorOfPos(3)} className="w-full h-full" />
          <Tile col={1} row={5} colorClass={colorOfPos(4)} className="w-full h-full" />

          <Tile col={1} row={3} colorClass={colorOfPos(5)} className="w-full h-full" />
          <Tile col={3} row={3} colorClass={colorOfPos(6)} className="w-full h-full" />
          <Tile col={5} row={3} colorClass={colorOfPos(7)} className="w-full h-full" />
          <Tile col={7} row={3} colorClass={colorOfPos(8)} className="w-full h-full" />
          <Tile col={9} row={3} colorClass={colorOfPos(9)} className="w-full h-full" />

          <Tile col={9} row={1} colorClass={colorOfPos(10)} className="w-full h-full" />
          <Tile col={7} row={1} colorClass={colorOfPos(11)} className="w-full h-full" />
          <Tile col={5} row={1} colorClass={colorOfPos(12)} className="w-full h-full" />
          <Tile col={3} row={1} colorClass={colorOfPos(13)} className="w-full h-full" />
          <Tile col={1} row={1} colorClass={colorOfPos(14)} className="w-full h-full" />
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
                router.push('/game/4/b') // ← ゴール後（必要に応じて変更）
              }
            }}
          />
        )}
      </div>
    </div>
  )
}