/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'; // useRef をインポート

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

const START_POS = { col: 9, row: 5 }

// タイルの座標リスト（step = 1 -> positions[0] で描画してるやつ）
const positions = [
  { col: 7, row: 5 },
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
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null)

  const {
    byId: tileById,
    tiles,
    loading: tilesLoading,
    error: tilesError,
  } = useTiles()

  // (デバッグ用 useEffect は変更なし)
  useEffect(() => { /* ... */ }, [tiles, tilesLoading, tilesError, tileById])

  const TOTAL_TILES = Math.min(
    positions.length,
    tiles?.length ?? positions.length,
  )

  const [step, setStep] = useState(0)
  const [, setServerTileID] = useState<number | null>(null)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | null
  >(null)

  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [currentEventDetail, setCurrentEventDetail]=useState<string |null>(null)
  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)

  // ★ Gamble (MoneyPlus) に渡すための所持金 State
  // (※) 100万円の初期値はここ (親ページ) で設定
  // const [money, setMoney] = useState<number>(1000000)

  const money = useGameStore((state) => state.money)
  // const setMoney = useGameStore((state) => state.setMoney)

  // ★ 1. activeEventColor の最新値を参照するための Ref を作成
  const activeEventColorRef = useRef(activeEventColor)
  useEffect(() => {
    // activeEventColor が変わるたびに Ref の中身を更新
    activeEventColorRef.current = activeEventColor
  }, [activeEventColor])


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

  // (デバッグログ用 useEffect 5つ は変更なし) ...

  // ===== ★ Firebase認証状態の監視 =====
  useEffect(() => {
    // (変更なし)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) { setAuthUser(user) }
      else {
        setAuthUser(null)
        if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      }
    })
    return () => unsubscribe()
  }, [])

  // ===== ★ WebSocket接続とハンドラ登録 (authUserに依存) =====
  useEffect(() => {
    if (authUser && !wsRef.current) {
      console.log('[Game1] トークン取得して connectGameSocket() 呼びます')

      authUser
      getIdToken(authUser)
        .then((token: string) => {
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
              console.log('[WS] QUIZ_REQUIRED:', { tileID, quizData })
              useGameStore.getState().setQuizReq({ tileID, quizData })
            },

            // ★ 修正点: onMoneyChanged
            onMoneyChanged: (userID: string, newMoney: number) => {
              if (!authUser || userID !== authUser.uid) return
              // ★ 2. バグ対策: モーダルが開いていない時は無視
              // (ROLL_DICE 直後の不要な更新をブロックする)
              if (activeEventColorRef.current === null) {
                console.log('[WS] onMoneyChanged IGNORED (no active event modal)', newMoney)
                return // ★ 無視
              }

              console.log('[WS] MONEY_CHANGED for me (processing):', newMoney)
              // setMoney((prev) => {
                const prev = useGameStore.getState().money
                const delta = newMoney - prev
                if (delta !== 0) {
                  useGameStore.getState().setMoneyChange({ delta })
                }
                // return newMoney // ★ 総額を更新
                useGameStore.getState().setMoney(newMoney)
              // })
            },

            // ★ 修正点: onGambleResult
            onGambleResult: (
              userID: string,
              _d: number,
              _c: 'High' | 'Low',
              _won: boolean,
              _amount: number,
              newMoney: number,
            ) => {
              if (!authUser || userID !== authUser.uid) return

              // ★ 2. バグ対策: モーダルが開いていない時は無視
              // (ROLL_DICE 直後の不要な更新をブロックする)
              if (activeEventColorRef.current === null) {
                console.log('[WS] onGambleResult IGNORED (no active event modal)', newMoney)
                return // ★ 無視
              }

              // もし Gamble.tsx がWSで通信する場合、
              // このハンドラがGambleの結果を受け取る唯一の方法になる
              // その場合、setMoney(newMoney) で総額を更新する

              console.log('[WS] GAMBLE_RESULT for me:', newMoney)
              // setMoney(newMoney)
              useGameStore.getState().setMoney(newMoney)
            },

            onPlayerMoved: (userID: string, newPosition: number) => {
              if (!authUser || userID !== authUser.uid) return
              console.log('[WS] onPlayerMoved (サーバーの計算結果):', newPosition)
              setServerTileID(newPosition)
            },

            onBranchChoiceRequired: (tileID: number, options: number[]) => {
              console.log('[WS] onBranchChoiceRequired:', { tileID, options })
              setBranchChoice({ tileID, options })
            },
          }

          wsRef.current = connectGameSocket(handlers, token)
        })
        .catch((error: any) => {
          console.error('[Game1] トークン取得またはWS接続に失敗:', error)
        })
    }

    return () => {
      if (wsRef.current) {
        console.log('[Game1] unmounting, wsRef.current?.close() 呼びます')
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [authUser]) // ★ 依存配列は [authUser] のまま

  // ===== ★ 修正: タイル効果の適用（バグ修正済み） =====
  function runTileEffect(tileId: number) {
    const tile = tileById.get(tileId)
    if (!tile) return
    const ef = tile.effect as { type?: string; amount?: number } | undefined
    if (!ef || !ef.type) return

    const currentMoney = useGameStore.getState().money

    // ★ 変更点: setMoney (総額更新) を使う
    if (ef.type === 'profit') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt !== 0) {
        useGameStore.getState().setMoneyChange({ delta: amt })
        useGameStore.getState().setMoney(currentMoney + amt)
        // setMoney((prev) => prev + amt) // ★ 総額を更新
        console.log('[Game1] PROFIT tile:', tileId, '+', amt)
      }
    } else if (ef.type === 'loss') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt !== 0) {
        useGameStore.getState().setMoneyChange({ delta: -amt })
        // setMoney((prev) => prev - amt) // ★ 総額を更新
        useGameStore.getState().setMoney( currentMoney - amt)
        console.log('[Game1] LOSS tile:', tileId, '-', amt)
      }
    }
  }

  // ===== コマを進める（フロント側のアニメーション） =====
  async function moveBy(stepsToMove: number) {
    // (変更なし)
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
      runTileEffect(pos)
    }

    if (pos > 0 && pos <= TOTAL_TILES) {
      const isGoal = pos === TOTAL_TILES
      const GOAL_EVENT_TYPE: EventType = 'branch'
      const currentTile = tileById.get(pos);
      const tileDetail = currentTile?.detail ?? '';
      const tileEventType: EventType | undefined = isGoal
        ? GOAL_EVENT_TYPE
        : kindToEventType(currentTile?.kind)
      const color = colorClassOfEvent(tileEventType)
      console.log('[Game1] tileEventType=', tileEventType, 'color=', color)

      if (color && EVENT_BY_COLOR[color]) {
        setActiveEventColor(color)
        if (tileEventType === 'overall' || tileEventType === 'neighbor'){ // 'global' のタイポ？
          console.log("[DUBUG] Setting EventDetail:", tileDetail);
          setCurrentEventDetail(tileDetail);
        }else{
        }
        if (isGoal) setGoalAwaitingEventClose(true)
      } else {
        setCurrentEventDetail(null);
      }
    }
  }

  // ===== サイコロ押下 =====
  function handleRollClick() {
    // (変更なし)
    if (isMoving || !!activeEventColor || !authUser) return
    if (!wsRef.current) {
      console.error('[Game1] roll: WS未接続！')
      return
    }
    setIsDiceOpen(true)
    setLastDiceResult(null)
    setExpectedFinalStep(null)
    wsRef.current?.sendRollDice()
  }

  // ===== サイコロ「マップに戻る」押下 =====
  function handleDiceConfirm() {
    // (変更なし)
    if (lastDiceResult != null) {
      moveBy(lastDiceResult)
    }
    setIsDiceOpen(false)
  }

  // ===== 分岐先を選んだとき =====
  function handleChooseBranch(selectionTileID: number) {
    // (変更なし)
    wsRef.current?.sendSubmitChoice(selectionTileID)
    setBranchChoice(null)
  }

  const colorOf = (id: number) =>
    colorClassOfEvent(kindToEventType(tileById.get(id)?.kind))

  // --- メインレンダー ---
  return (
    <div className='relative w-full h-[100dvh] bg-brown-light grid place-items-center'>
      <div className='relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden'>
        <Image
          src='/back1.png'
          alt=''
          fill
          className='object-cover z-0 pointer-events-none opacity-70'
          aria-hidden
          priority
          sizes='100vw'
        />

        {/* ★ GameHUD に money (総額) を渡す */}
        <GameHUD
          money={money}
          remaining={TOTAL_TILES - step}
          className='w-full absolute top-[3%] left-[3%]'
        />

        <div className='absolute top-[3%] right-[6%]'>
          <SettingsMenu sizePct={8} className='w-1/5 z-10' />
        </div>
        <div className='absolute top-[15%] left-[3%] z-10'>
          <Status />
        </div>

        <div className='absolute bottom-[10%] sm:bottom-[12%] right-[18%] rounded-md bg-brown-default/90 text-white border-2 border-white px-4 py-2 md:py-8 md:px-12 font-bold text-xl md:text-3xl z-20'>
          スタート
        </div>

        <DiceButton
          onClick={handleRollClick}
          disabled={isMoving || !!activeEventColor || !authUser}
          className='absolute right-[3%] bottom-[3%] z-10'
        />

        <DiceOverlay
          isOpen={isDiceOpen}
          diceResult={lastDiceResult}
          onClose={() => { setIsDiceOpen(false) }}
          onConfirm={handleDiceConfirm}
        />

        {/* マップタイル配置 */}
        <div
          className='absolute inset-0 grid grid-cols-9 grid-rows-5 px-[10%] pt-[9.5%] pb-[7%]'
          style={{
            gridTemplateColumns:
              '9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5%',
            gridTemplateRows: '18% 20% 18% 26% 18%',
          }}
        >
          {/* (Tile コンポーネント群は省略) */}
          <Tile
            col={7}
            row={5}
            colorClass={colorOf(1)}
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={5}
            colorClass={colorOf(2)}
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={5}
            colorClass={colorOf(3)}
            className='w-full h-full'
          />
          <Tile
            col={1}
            row={5}
            colorClass={colorOf(4)}
            className='w-full h-full'
          />
          <Tile
            col={1}
            row={3}
            colorClass={colorOf(5)}
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={3}
            colorClass={colorOf(6)}
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={3}
            colorClass={colorOf(7)}
            className='w-full h-full'
          />
          <Tile
            col={7}
            row={3}
            colorClass={colorOf(8)}
            className='w-full h-full'
          />
          <Tile
            col={9}
            row={3}
            colorClass={colorOf(9)}
            className='w-full h-full'
          />
          <Tile
            col={9}
            row={1}
            colorClass={colorOf(10)}
            className='w-full h-full'
          />
          <Tile
            col={7}
            row={1}
            colorClass={colorOf(11)}
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={1}
            colorClass={colorOf(12)}
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={1}
            colorClass={colorOf(13)}
            className='w-full h-full'
          />
          <Tile
            col={1}
            row={1}
            colorClass={colorOf(14)}
            className='w-full h-full'
          />
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
          label='あなた'
          imgSrc='/player1.png'
        />

        {/* ★ ゴール等のイベントモーダル (Gamble に props を渡す) ★ */}
        {EventComp && (
          <EventComp
            // ▼▼▼ ここから2行が Gamble のために追加 ▼▼▼
            // currentMoney={money}
            // onUpdateMoney={setMoney} // Game1のsetMoney(総額更新)を渡す
            // ▲▲▲ ここまで追加 ▲▲▲

            eventMessage={currentEventDetail ?? ''}
            onClose={() => {
              console.log(
                '[Game1] EventComp onClose (activeEventColor=',
                activeEventColor,
                ')',
              )
              setActiveEventColor(null)
              setCurrentEventDetail(null)
              useGameStore.getState().clearMoneyChange();
              // useGameStore.getState().clearNeighborReq(); // store.ts に存在しない

              if (goalAwaitingEventClose && !goalPushedRef.current) {
                goalPushedRef.current = true
                setGoalAwaitingEventClose(false)
                router.push('/game/2/a')
              }
            }}
          />
        )}


        {/* (未ログイン時UI は変更なし) ... */}
        {!authUser && (
          <div className='absolute inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            {/* ... */}
          </div>
        )}
      </div>
    </div>
  )
}
