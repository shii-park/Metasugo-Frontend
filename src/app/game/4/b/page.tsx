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

// 型・イベント
import type { EventType } from '@/app/api/game/type'
import { EVENT_BY_COLOR } from '@/components/events'
import Finish from '@/components/events/Finish'

// UI
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

// ===== レイアウト（4b） =====
const START_POS = { col: 1, row: 5 }
const positions = [
  { col: 1, row: 5 },
  { col: 3, row: 5 },
  { col: 5, row: 5 },
  { col: 7, row: 5 },
  { col: 7, row: 3 },
  { col: 5, row: 3 },
  { col: 3, row: 3 },
  { col: 1, row: 3 },
  { col: 1, row: 1 },
  { col: 3, row: 1 },
  { col: 5, row: 1 },
  { col: 7, row: 1 },
]
const TOTAL_TILES = positions.length

const COLS = [1.75, 12, 5.5, 10.125, 5.5, 5, 15.75]
const ROWS = [12, 11, 18, 8, 18]
const PAD_X = 7.2
const PAD_TOP = 16
const PAD_BOTTOM = 7

const TILE_IDS = [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90] as const
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

export default function Game4b() {
  const router = useRouter()
  const goalPushedRef = useRef(false)

  // ===== 認証 =====
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)

  // ===== タイルデータ =====
  const {
    byId: tileById,
    tiles,
    loading: tilesLoading,
    error: tilesError,
  } = useTiles()

  useEffect(() => {
    console.log('[Game4b] useTiles:', { tilesLoading, tilesError })
    if (tiles) console.log('[Game4b] tiles len:', tiles.length)
  }, [tilesLoading, tilesError, tiles])

  // ===== 進行 =====
  const [step, setStep] = useState(0)
  const [, setServerTileID] = useState<number | null>(null)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | null
  >(null)
  const [showFinish, setShowFinish] = useState(false)

  // ===== イベント =====
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [currentEventDetail, setCurrentEventDetail] = useState<string | null>(
    null,
  )
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)

  // 所持金
  const [money, setMoney] = useState<number>(1000000)

  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null
  const [, setExpectedFinalStep] = useState<number | null>(null)
  const [, setBranchChoice] = useState<{
    tileID: number
    options: number[]
  } | null>(null)
  const wsRef = useRef<GameSocketConnection | null>(null)

  const cur = useMemo(
    () => (step === 0 ? START_POS : positions[step - 1]),
    [step],
  )

  /** 盤面 index（1..12）から色クラスを返す。最後は強制イベントを適用 */
  const colorOfPos = (posIndex: number) => {
    const id = tileIdAt(posIndex)
    const isLast = posIndex === TOTAL_TILES
    const ev = isLast ? FORCE_LAST_EVENT : eventTypeOfTile(tileById.get(id))
    return colorClassOfEvent(ev)
  }

  // ===== 認証監視 =====
  useEffect(() => {
    const un = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[Game4b] logged in:', user.uid)
        setAuthUser(user)
      } else {
        setAuthUser(null)
        wsRef.current?.close()
        wsRef.current = null
      }
    })
    return () => un()
  }, [])

  // ===== WS 接続 =====
  useEffect(() => {
    if (authUser && !wsRef.current) {
      getIdToken(authUser)
        .then((token) => {
          const handlers = {
            onDiceResult: (userID: string, diceValue: number) => {
              if (!authUser || userID !== authUser.uid) return
              const v = Math.max(1, Math.min(6, Math.floor(diceValue))) as
                | 1
                | 2
                | 3
                | 4
                | 5
                | 6
              setLastDiceResult(v)
            },
            onQuizRequired: (tileID: number, quizData: QuizData) => {
              useGameStore.getState().setQuizReq({ tileID, quizData })
            },
            onMoneyChanged: (userID: string, newMoney: number) => {
              if (!authUser || userID !== authUser.uid) return
              setMoney((prev) => {
                const delta = newMoney - prev
                if (delta !== 0)
                  useGameStore.getState().setMoneyChange({ delta })
                return newMoney
              })
            },
            onGambleResult: (
              _u: string,
              _d: number,
              _c: 'High' | 'Low',
              _w: boolean,
              _amt: number,
              newMoney: number,
            ) => {
              setMoney(newMoney)
            },
            onPlayerMoved: (userID: string, newPosition: number) => {
              if (!authUser || userID !== authUser.uid) return
              setServerTileID(newPosition)
            },
            onBranchChoiceRequired: (tileID: number, options: number[]) => {
              setBranchChoice({ tileID, options })
            },
            onPlayerFinished: (userID: string, finalMoney: number) => {
              if (!authUser || userID !== authUser.uid) return
              setMoney(finalMoney)
              useGameStore.getState().setMoney(finalMoney)
              try {
                wsRef.current?.close()
              } finally {
                wsRef.current = null
              }
            },
          } as const

          wsRef.current = connectGameSocket(handlers, token)
        })
        .catch((e) => console.error('[Game4b] WS connect failed:', e))
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [authUser])

  // ===== タイル効果 =====
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

  // ===== 前進 =====
  async function moveBy(stepsToMove: number) {
    if (isMoving || activeEventColor || showFinish) return
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

    if (pos === TOTAL_TILES) {
      setShowFinish(true)
      return
    }

    if (pos > 0 && pos <= TOTAL_TILES) {
      const tileId = tileIdAt(pos)
      runTileEffectByTileId(tileId)

      const isGoal = pos === TOTAL_TILES
      const currentTile = tileById.get(tileId)

      // goal マスは 'goal' を優先
      const tileEventType: EventType | undefined = isGoal ? 'goal' : eventTypeOfTile(currentTile)
      const color = colorClassOfEvent(tileEventType)

      setActiveEventColor(color ?? null)
      setCurrentEventDetail(
        tileEventType === 'overall' || tileEventType === 'neighbor'
          ? (currentTile?.detail ?? '')
          : null,
      )
      setGoalAwaitingEventClose(isGoal)
    }
  }

  // ===== サイコロ =====
  function handleRollClick() {
    if (isMoving || !!activeEventColor || !authUser || showFinish) return
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
    <div className='relative w-full h-[100dvh] bg-brown-light grid place-items-center'>
      <div className='relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden'>
        <Image
          src='/back4.png'
          alt=''
          fill
          className='object-cover z-0 pointer-events-none opacity-70'
          aria-hidden
          priority
        />

        {/* HUD */}
        <GameHUD
          money={money}
          remaining={Math.max(TOTAL_TILES - step, 0)}
          className='w-full absolute top-[3%] left-[3%]'
        />
        <div className='absolute top-[3%] right-[6%]'>
          <SettingsMenu sizePct={8} className='w-1/5 z-10' />
        </div>
        {/* <div className='absolute top-[15%] left-[3%] z-10'>
          <Status />
        </div> */}

        {/* ゴール */}
        <div className='absolute top-[10%] sm:top-[12%] right-[13%] rounded-md bg-brown-default/90 text-white border-2 border-white w-[20%] h-[20%] font-bold text-xl md:text-3xl flex items-center justify-center z-20'>
          ゴール
        </div>

        {/* サイコロ */}
        <DiceButton
          onClick={handleRollClick}
          disabled={isMoving || !!activeEventColor || !authUser || showFinish}
          className='absolute right-[3%] bottom-[3%] z-10'
        />
        <DiceOverlay
          isOpen={isDiceOpen}
          diceResult={lastDiceResult}
          onClose={() => setIsDiceOpen(false)}
          onConfirm={handleDiceConfirm}
        />

        {/* タイル配置 */}
        <div
          className='absolute inset-0 grid grid-cols-7 grid-rows-5 px-[8%] pt-[8.5%] pb-[8%]'
          style={{
            gridTemplateColumns: '8.5% 18% 8.5% 18% 8.5% 18% 8.5%',
            gridTemplateRows: '17% 23.5% 17% 24% 17%',
          }}
        >
          {/* 下段 */}
          <Tile col={1} row={5} colorClass={colorOfPos(1)} />
          <Tile col={3} row={5} colorClass={colorOfPos(2)} />
          <Tile col={5} row={5} colorClass={colorOfPos(3)} />
          <Tile col={7} row={5} colorClass={colorOfPos(4)} />

          <Tile col={7} row={3} colorClass={colorOfPos(5)} />
          <Tile col={5} row={3} colorClass={colorOfPos(6)} />
          <Tile col={3} row={3} colorClass={colorOfPos(7)} />
          <Tile col={1} row={3} colorClass={colorOfPos(8)} />

          <Tile col={1} row={1} colorClass={colorOfPos(9)} />
          <Tile col={3} row={1} colorClass={colorOfPos(10)} />
          <Tile col={5} row={1} colorClass={colorOfPos(11)} />
          <Tile col={7} row={1} colorClass={colorOfPos(12)} />
          {/* 最後はゴール手前まで */}
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
          label='あなた'
          imgSrc='/player1.png'
        />

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
              }
            }}
          />
        )}

        {showFinish && (
          <Finish
            title='ゴール！'
            onClose={() => {
              if (wsRef.current) {
                try {
                  wsRef.current.close()
                  console.log('[Game4a] WS closed')
                } catch (e) {
                  console.error('[Game4a] WS close error:', e)
                } finally {
                  wsRef.current = null
                }
              }
              setShowFinish(false)
              // router.push('/') // 必要ならコメント解除
            }}
          />
        )}

        {!authUser && (
          <div className='absolute inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='text-white text-2xl font-bold drop-shadow-lg'>
              認証中...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
