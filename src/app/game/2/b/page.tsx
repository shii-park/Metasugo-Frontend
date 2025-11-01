'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { auth } from '@/firebase'
import {
  User as FirebaseUser,
  getIdToken,
  onAuthStateChanged,
} from 'firebase/auth'

import type { EventType } from '@/app/api/game/type'
import { EVENT_BY_COLOR } from '@/components/events'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import Player from '@/components/game/Player'
import SettingsMenu from '@/components/game/SettingMenu'
import Status from '@/components/game/Status'
import Tile from '@/components/game/Tile'

import { colorClassOfEvent } from '@/lib/game/eventColor'
import { kindToEventType } from '@/lib/game/kindMap'
import { useGameStore } from '@/lib/game/store'
import { useTiles } from '@/lib/game/useTiles'
import {
  connectGameSocket,
  GameSocketConnection,
  QuizData,
} from '@/lib/game/wsClient'

const START_POS = { col: 1, row: 5 }
const positions = [
  { col: 1, row: 5 }, { col: 3, row: 5 }, { col: 5, row: 5 }, { col: 7, row: 5 },
  { col: 7, row: 3 }, { col: 5, row: 3 }, { col: 3, row: 3 }, { col: 1, row: 3 },
  { col: 1, row: 1 }, { col: 3, row: 1 }, { col: 5, row: 1 }, { col: 7, row: 1 },
]
const COLS = [1.75, 12, 5.5, 10.125, 5.5, 5, 15.75]
const ROWS = [12, 11, 18, 8, 18]
const PAD_X = 7.2
const PAD_TOP = 16
const PAD_BOTTOM = 7

export default function Game2b() {
  const router = useRouter()
  const goalPushedRef = useRef(false)
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)

  const { byId: tileById, tiles } = useTiles()

  const TOTAL_TILES = Math.min(positions.length, tiles?.length ?? positions.length)
  const [step, setStep] = useState(0)
  const [, setServerTileID] = useState<number | null>(null)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)

  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [currentEventDetail, setCurrentEventDetail] = useState<string | null>(null)
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)

  const money = useGameStore((state) => state.money);

  // const setMoney = useGameStore((state) => state.setMoney);

  // const { money, setMoney, setFinalMoney } = useGameStore((state) => ({
  //   money: state.money,
  //   setMoney: state.setMoney,
  //   setFinalMoney: state.setFinalMoney,
  // }))
  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  const [, setExpectedFinalStep] = useState<number | null>(null)
  const [, setBranchChoice] = useState<{ tileID: number; options: number[] } | null>(null)
  const wsRef = useRef<GameSocketConnection | null>(null)

  const cur = useMemo(() => (step === 0 ? START_POS : positions[step - 1]), [step])

  useEffect(() => {
    const un = onAuthStateChanged(auth, (user) => {
      if (user) setAuthUser(user)
      else {
        setAuthUser(null)
        wsRef.current?.close()
        wsRef.current = null
      }
    })
    return () => un()
  }, [])

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
              const prevMoney = useGameStore.getState().money;
              const delta = newMoney - prevMoney;
              if (delta !== 0) useGameStore.getState().setMoneyChange({ delta });
              useGameStore.getState().setMoney(newMoney);
            },
            onGambleResult: (_u: string, _d: number, _c: 'High' | 'Low', _w: boolean, _a: number, newMoney: number) => {
              useGameStore.getState().setMoney(newMoney);
            },
            onPlayerMoved: (userID: string, newPosition: number) => {
              if (!authUser || userID !== authUser.uid) return
              setServerTileID(newPosition)
            },
            onBranchChoiceRequired: (tileID: number, options: number[]) => {
              setBranchChoice({ tileID, options })
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onPlayerFinished: (userID: string, _money: number) => {
              if (!authUser || userID !== authUser.uid) return
              try { wsRef.current?.close() } finally { wsRef.current = null }
            },
          } as const
          wsRef.current = connectGameSocket(handlers, token)
        })
        .catch((e) => console.error('[Game2b] WS connect failed:', e))
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [authUser])

  function runTileEffect(tileId: number) {
    const tile = tileById.get(tileId)
    if (!tile) return
    const ef = tile.effect as { type?: string; amount?: number } | undefined
    if (!ef || !ef.type) return
    
    const currentMoney = useGameStore.getState().money;

    if (ef.type === 'profit') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt) {
        useGameStore.getState().setMoneyChange({ delta: amt })
        useGameStore.getState().setMoney(currentMoney + amt);
      }
    } else if (ef.type === 'loss') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt) {
        useGameStore.getState().setMoneyChange({ delta: -amt })
        useGameStore.getState().setMoney(currentMoney - amt)
      }
    }
  }

  async function moveBy(n: number) {
    if (isMoving || activeEventColor) return
    if (step >= TOTAL_TILES) return

    setIsMoving(true)
    let pos = step
    for (let i = 0; i < n; i++) {
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
      const GOAL_EVENT_TYPE: EventType = 'branch'
      const currentTile = tileById.get(pos)
      const tileDetail = currentTile?.detail ?? ''
      const tileEventType: EventType | undefined = isGoal ? GOAL_EVENT_TYPE : kindToEventType(currentTile?.kind)
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

  const colorOf = (id: number) => colorClassOfEvent(kindToEventType(tileById.get(id)?.kind))

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        <Image
          src="/back2.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover z-0 pointer-events-none opacity-70"
          aria-hidden
          priority
        />

        <GameHUD money={money} remaining={TOTAL_TILES - step} className="w-full absolute top-[3%] left-[3%]" />
        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
        </div>
        <div className="absolute top-[15%] left-[3%] z-10">
          <Status />
        </div>

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

        <div
          className="absolute inset-0 grid grid-cols-7 grid-rows-5 px-[8%] pt-[8.5%] pb-[8%]"
          style={{
            gridTemplateColumns: '8.5% 18% 8.5% 18% 8.5% 18% 8.5%',
            gridTemplateRows: '17% 23.5% 17% 24% 17%',
          }}
        >
          <Tile col={1} row={5} colorClass={colorOf(27)} className="w-full h-full" />
          <Tile col={3} row={5} colorClass={colorOf(28)} className="w-full h-full" />
          <Tile col={5} row={5} colorClass={colorOf(29)} className="w-full h-full" />
          <Tile col={7} row={5} colorClass={colorOf(30)} className="w-full h-full" />

          <Tile col={7} row={3} colorClass={colorOf(31)} className="w-full h-full" />
          <Tile col={5} row={3} colorClass={colorOf(32)} className="w-full h-full" />
          <Tile col={3} row={3} colorClass={colorOf(33)} className="w-full h-full" />
          <Tile col={1} row={3} colorClass={colorOf(34)} className="w-full h-full" />

          <Tile col={1} row={1} colorClass={colorOf(35)} className="w-full h-full" />
          <Tile col={3} row={1} colorClass={colorOf(36)} className="w-full h-full" />
          <Tile col={5} row={1} colorClass={colorOf(37)} className="w-full h-full" />
          <Tile col={7} row={1} colorClass={colorOf(26)} className="w-full h-full" />
        </div>

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

        {EventComp && (
          <EventComp
            // currentMoney={money}
            // onUpdateMoney={setMoney}
            eventMessage={currentEventDetail ?? ''}
            onClose={() => {
              setActiveEventColor(null)
              setCurrentEventDetail(null)
              useGameStore.getState().clearMoneyChange()
              useGameStore.getState().clearNeighborReq()

              if (goalAwaitingEventClose && !goalPushedRef.current) {
                goalPushedRef.current = true
                setGoalAwaitingEventClose(false)
                router.push('/game/3/b') // ★ 2b → 3b
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
