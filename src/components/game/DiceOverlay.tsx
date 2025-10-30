'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export type DiceOverlayProps = {
  isOpen: boolean
  // サーバーからもらった確定の出目。まだ出てないなら null
  diceResult: 1 | 2 | 3 | 4 | 5 | 6 | null
  // 「マップに戻る」押下時に呼ばれる。親側で moveBy(...) する
  onConfirm?: () => void
  // オーバーレイを閉じるためのハンドラ
  onClose: () => void
}

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

function DiceFace({
  value,
  size = 128,
}: {
  value: DiceFaceValue
  size?: number
}) {
  const pos = {
    tl: { cx: 24, cy: 24 },
    tm: { cx: 48, cy: 24 },
    tr: { cx: 72, cy: 24 },
    ml: { cx: 24, cy: 48 },
    mm: { cx: 48, cy: 48 },
    mr: { cx: 72, cy: 48 },
    bl: { cx: 24, cy: 72 },
    bm: { cx: 48, cy: 72 },
    br: { cx: 72, cy: 72 },
  } as const

  const map: Record<DiceFaceValue, Array<keyof typeof pos>> = {
    1: ['mm'],
    2: ['tl', 'br'],
    3: ['tl', 'mm', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'mm', 'bl', 'br'],
    6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'],
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label={`サイコロの目は ${value}`}
    >
      <rect
        x="4"
        y="4"
        width="88"
        height="88"
        rx="14"
        fill="white"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="2"
      />
      {map[value].map((k) => (
        <circle key={k} cx={pos[k].cx} cy={pos[k].cy} r={8} fill="black" />
      ))}
    </svg>
  )
}

export default function DiceOverlay({
  isOpen,
  diceResult,
  onClose,
  onConfirm,
}: DiceOverlayProps) {
  // ぐるぐる表示用
  const [rollingFace, setRollingFace] = useState<DiceFaceValue>(1)
  const [isRollingAnim, setIsRollingAnim] = useState(false)

  // 「最終的に表示する確定値」
  // これが null の間はまだ確定演出前（=回ってる状態扱い）
  const [finalValue, setFinalValue] = useState<DiceFaceValue | null>(null)

  // オーバーレイを開いた時刻（アニメの最低再生時間を測る）
  const openedAtRef = useRef<number>(0)

  // 最低このくらいは回す（ms）
  const MIN_SPIN_MS = 600

  // === オーバーレイのopen/close監視 ===
  useEffect(() => {
    if (isOpen) {
      console.log('[DiceOverlay] OPEN → アニメ初期化')
      setRollingFace(1)
      setIsRollingAnim(true)
      setFinalValue(null)
      openedAtRef.current = Date.now()
    } else {
      console.log('[DiceOverlay] CLOSE → アニメ停止')
      setIsRollingAnim(false)
      setFinalValue(null)
    }
  }, [isOpen])

  // === くるくる回すタイマー ===
  useEffect(() => {
    if (!isRollingAnim) return
    // finalValue がもう確定してたら回す必要はない
    if (finalValue !== null) return

    console.log('[DiceOverlay] 回転tick開始 (interval 500ms)')
    const id = setInterval(() => {
      setRollingFace((prev) => {
        const nextVal = ((prev % 6) + 1) as DiceFaceValue
        return nextVal
      })
    }, 500)

    return () => {
      console.log('[DiceOverlay] 回転tick終了 (clearInterval)')
      clearInterval(id)
    }
  }, [isRollingAnim, finalValue])

  // === サーバーから diceResult が届いたら、最低スピン時間を満たした後に確定させる ===
  useEffect(() => {
    // オーバーレイ閉じてたら無視
    if (!isOpen) return
    // まだサーバーから確定してないなら何もしない
    if (diceResult == null) return
    // すでに確定値セット済みなら何もしない
    if (finalValue !== null) return

    const elapsed = Date.now() - openedAtRef.current
    const waitMs = elapsed < MIN_SPIN_MS ? MIN_SPIN_MS - elapsed : 0

    console.log(
      `[DiceOverlay] diceResult(${diceResult}) 取得。elapsed=${elapsed}ms waitMs=${waitMs}ms`
    )

    const timeoutId = setTimeout(() => {
      console.log('[DiceOverlay] 最終値を確定 ->', diceResult)
      setFinalValue(diceResult)
      setIsRollingAnim(false)
    }, waitMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [diceResult, isOpen, finalValue])

  // 実際に表示する目：
  // - finalValue が決まってたら finalValue
  // - まだなら rollingFace
  const faceToShow: DiceFaceValue = finalValue ?? rollingFace

  // 決定済みかどうか（ボタン出す条件）
  const isDecided = finalValue !== null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* サイコロ本体 */}
          <motion.div
            className="rounded-xl bg-blue-default/10 p-6"
            animate={isRollingAnim ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isRollingAnim
                ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                : { duration: 0.4, ease: 'easeOut' }
            }
          >
            <DiceFace value={faceToShow} size={160} />
          </motion.div>

          {/* ステータス文言 */}
          <div className="mt-4 h-8 flex items-center">
            {isDecided ? (
              <div className="text-2xl md:text-3xl font-bold text-white drop-shadow">
                {faceToShow}マスすすむ
              </div>
            ) : (
              <div className="text-lg md:text-xl text-white drop-shadow">
                サイコロ判定中...
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="mt-6">
            {isDecided ? (
              <button
                type="button"
                onClick={() => {
                  console.log('[DiceOverlay] 「マップに戻る」クリック, finalValue =', finalValue)
                  onConfirm?.()
                  onClose()
                }}
                className="px-10 py-3 rounded-md bg-blue-default text-white text-lg shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                マップに戻る
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-10 py-3 rounded-md bg-blue-default/40 text-white text-lg shadow-md cursor-wait"
              >
                さいころ中...
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
