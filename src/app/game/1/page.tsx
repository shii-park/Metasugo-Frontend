/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

// ★ Firebase Auth から必要な関数をインポート
// ★ Firebase Auth からは onAuthStateChanged と User型 (別名で) のみインポート
import {
  User as FirebaseUser,
  getIdToken,
  onAuthStateChanged,
} from 'firebase/auth'
// ★ firebase.ts から 'auth' インスタンスを直接インポート
import { auth } from '@/firebase'

import type { EventType } from '@/app/api/game/type'
// ▼▼▼ index.ts から EVENT_BY_COLOR をインポート ▼▼▼
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
  QuizData, // ★ 型をインポート
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

  // ↓ デバッグ用 useEffect
  useEffect(() => {
    console.log('[Game1] useTiles() state:', {
      loading: tilesLoading,
      error: tilesError,
    })
    if (tiles) {
      console.log('[Game1] tiles loaded:', tiles)
      console.log('[Game1] tileById map:', Array.from(tileById.entries()))
    }
  }, [tiles, tilesLoading, tilesError, tileById])

  const TOTAL_TILES = Math.min(
    positions.length,
    tiles?.length ?? positions.length,
  )

  const [step, setStep] = useState(0)
  const [serverTileID, setServerTileID] = useState<number | null>(null)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [lastDiceResult, setLastDiceResult] = useState<
    1 | 2 | 3 | 4 | 5 | 6 | null
  >(null)

  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [currentEventDetail, setCurrentEventDetail] = useState<string | null>(
    null,
  )

  const [goalAwaitingEventClose, setGoalAwaitingEventClose] = useState(false)

  // ★ Gamble (MoneyPlus) に渡すための所持金 State
  // (※) 100万円の初期値はここ (親ページ) で設定
  const [money, setMoney] = useState<number>(1000000)

  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  const [, setExpectedFinalStep] = useState<number | null>(null)
  const [branchChoice, setBranchChoice] = useState<{
    tileID: number
    options: number[]
  } | null>(null)
  const wsRef = useRef<GameSocketConnection | null>(null)
  const cur = useMemo(
    () => (step === 0 ? START_POS : positions[step - 1]),
    [step],
  )

  // (デバッグ用 useEffect は省略) ...

  // ===== ★ Firebase認証状態の監視 =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[Auth] ログイン済み:', user.uid)
        setAuthUser(user)
      } else {
        console.log('[Auth] ログアウト状態')
        setAuthUser(null)
        if (wsRef.current) {
          console.log('[Game1] ログアウトのため WS接続を close() します')
          wsRef.current.close()
          wsRef.current = null
        }
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
              console.log('[WS] onDiceResult:', { userID, diceValue })
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

            // ★ 変更点: WSから所持金総額が送られてきたら、setMoneyで更新
            onMoneyChanged: (userID: string, newMoney: number) => {
              if (!authUser || userID !== authUser.uid) return
              console.log('[WS] MONEY_CHANGED for me:', newMoney)
              setMoney((prev) => {
                const delta = newMoney - prev
                if (delta !== 0) {
                  // MoneyMinus 用に差額をストアに保存
                  useGameStore.getState().setMoneyChange({ delta })
                }
                return newMoney // ★ 総額を更新
              })
            },

            // ★ 変更点: Gambleの結果も setMoney で総額を更新
            onGambleResult: (
              userID: string,
              _d: number,
              _c: 'High' | 'Low',
              won: boolean,
              amount: number,
              newMoney: number,
            ) => {
              if (!authUser || userID !== authUser.uid) return

              // Gamble.tsx がAPIを呼ぶので、このWSハンドラは不要かもしれないが、
              // 他プレイヤーのGamble結果を反映するために残す

              // もし Gamble.tsx がWSで通信する場合、
              // このハンドラがGambleの結果を受け取る唯一の方法になる
              // その場合、setMoney(newMoney) で総額を更新する

              console.log('[WS] GAMBLE_RESULT for me:', newMoney)
              // (※) Gamble.tsx のAPI通信が成功すると、そのレスポンスで
              // onUpdateMoney(newMoney) が呼ばれ setMoney が更新される。
              // このWSイベントが二重で setMoney(newMoney) を呼ぶ可能性が
              // あるが、同じ値で更新するだけなので実害はない。
              setMoney(newMoney)
            },

            onPlayerMoved: (userID: string, newPosition: number) => {
              console.log('[WS] onPlayerMoved (サーバーの計算結果):', {
                userID,
                newPosition,
              })
              if (!authUser || userID !== authUser.uid) return
              setServerTileID(newPosition)
            },

            onBranchChoiceRequired: (tileID: number, options: number[]) => {
              console.log('[WS] onBranchChoiceRequired:', { tileID, options })
              setBranchChoice({ tileID, options })
            },

            onPlayerFinished: (userID: string, money: number) => {
              // 自分宛て以外は無視
              if (!authUser || userID !== authUser.uid) return

              console.log(
                '[WS] PLAYER_FINISHED for me. close WebSocket. money=',
                money,
              )

              // ここで UI 遷移やストア反映をしたい場合は任意で:
              // useGameStore.getState().setFinalMoney?.(money)
              // router.push('/result') など
            },
          } as const

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
  }, [authUser])

  // ===== タイル効果の適用（フロント権威：踏破時に即お金を更新） =====
  function runTileEffect(tileId: number) {
    const tile = tileById.get(tileId)
    if (!tile) return
    const ef = tile.effect as { type?: string; amount?: number } | undefined
    if (!ef || !ef.type) return

    // ★ 変更点: setMoney (総額更新) を使う
    if (ef.type === 'profit') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt !== 0) {
        useGameStore.getState().setMoneyChange({ delta: amt })
        setMoney((prev) => prev + amt) // ★ 総額を更新
        console.log('[Game1] PROFIT tile:', tileId, '+', amt)
      }
    } else if (ef.type === 'loss') {
      const amt = Number(ef.amount ?? 0) || 0
      if (amt !== 0) {
        useGameStore.getState().setMoneyChange({ delta: -amt })
        setMoney((prev) => prev - amt) // ★ 総額を更新
        console.log('[Game1] LOSS tile:', tileId, '-', amt)
      }
    }
  }

  // ===== コマを進める（フロント側のアニメーション） =====
  async function moveBy(stepsToMove: number) {
    console.log('[Game1] moveBy called with stepsToMove=', stepsToMove)
    if (isMoving || activeEventColor) {
      console.log('[Game1] moveBy: いまは動けない')
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
      console.log('[Game1] moving... pos ->', pos)
      setStep(pos)
      await new Promise((r) => setTimeout(r, 250))
      if (pos === TOTAL_TILES) break
    }
    setIsMoving(false)
    console.log('[Game1] moveBy done. final pos=', pos)
    setExpectedFinalStep(pos)

    // お金増減イベントを即時適用
    if (pos > 0 && pos <= TOTAL_TILES) {
      runTileEffect(pos)
    }

    // タイルイベント（色のやつなど）
    if (pos > 0 && pos <= TOTAL_TILES) {
      const isGoal = pos === TOTAL_TILES
      const GOAL_EVENT_TYPE: EventType = 'branch' // 仮のイベント色

      const currentTile = tileById.get(pos)
      const tileDetail = currentTile?.detail ?? ''

      const tileEventType: EventType | undefined = isGoal
        ? GOAL_EVENT_TYPE
        : kindToEventType(currentTile?.kind)

      const color = colorClassOfEvent(tileEventType)

      console.log('[Game1] tileEventType=', tileEventType, 'color=', color)

      if (color && EVENT_BY_COLOR[color]) {
        setActiveEventColor(color)

        if (tileEventType === 'overall' || tileEventType === 'neighbor') {
          console.log('[DUBUG] Setting EventDetail:', tileDetail)
          setCurrentEventDetail(tileDetail)
        } else {
          // console.log("[DEBUG] Clearing EventDetail.");
        }

        if (isGoal) setGoalAwaitingEventClose(true)
      } else {
        setCurrentEventDetail(null)
      }
    }
  }

  // ===== サイコロ押下 =====
  function handleRollClick() {
    console.log('[Game1] handleRollClick')
    if (isMoving || !!activeEventColor || !authUser) {
      console.log('[Game1] roll: 不可')
      return
    }
    if (!wsRef.current) {
      console.error('[Game1] roll: WS未接続！')
      return
    }
    setIsDiceOpen(true)
    setLastDiceResult(null)
    setExpectedFinalStep(null)
    console.log('[Game1] sendRollDice()')
    wsRef.current?.sendRollDice()
  }

  // ===== サイコロ「マップに戻る」押下 =====
  function handleDiceConfirm() {
    console.log('[Game1] handleDiceConfirm lastDiceResult=', lastDiceResult)
    if (lastDiceResult != null) {
      moveBy(lastDiceResult)
    }
    setIsDiceOpen(false)
  }

  // ===== 分岐先を選んだとき =====
  function handleChooseBranch(selectionTileID: number) {
    console.log('[Game1] handleChooseBranch selectionTileID=', selectionTileID)
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
          onClose={() => {
            console.log('[Game1] DiceOverlay onClose')
            setIsDiceOpen(false)
          }}
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
            currentMoney={money}
            onUpdateMoney={setMoney} // Game1のsetMoney(総額更新)を渡す
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
              useGameStore.getState().clearMoneyChange()
              useGameStore.getState().clearNeighborReq()

              if (goalAwaitingEventClose && !goalPushedRef.current) {
                goalPushedRef.current = true
                setGoalAwaitingEventClose(false)
                router.push('/game/2/a')
              }
            }}
          />
        )}

        {/* ★ 未ログイン時のローディング/エラー表示 */}
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
