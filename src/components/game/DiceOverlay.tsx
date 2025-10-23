// app/components/DiceOverlay.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type DiceOverlayProps = {
  isOpen: boolean
  onClose: () => void
  getDiceValue?: () => Promise<1|2|3|4|5|6> | 1|2|3|4|5|6
}

type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6

function DiceFace({ value, size = 128 }: { value: DiceFaceValue; size?: number }) {
  const r = 8
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
      <rect x="4" y="4" width="88" height="88" rx="14" fill="white" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      {map[value].map((k) => (
        <circle key={k} cx={pos[k].cx} cy={pos[k].cy} r={r} fill="black" />
      ))}
    </svg>
  )
}

export default function DiceOverlay({
  isOpen,
  onClose,
  getDiceValue,
}: DiceOverlayProps) {
  const [isRolling, setIsRolling] = useState(false)
  const [value, setValue] = useState<DiceFaceValue | null>(null)
  const [error, setError] = useState<string | null>(null)
  const openedAtRef = useRef<number>(0)

  useEffect(() => {
    if (isOpen) {
      setValue(null)
      setError(null)
      setIsRolling(true)
      openedAtRef.current = Date.now()
    } else {
      setIsRolling(false)
      setValue(null)
    }
  }, [isOpen])

  const MIN_SPIN_MS = 600

  const fetchValue = useCallback(async (): Promise<DiceFaceValue> => {
    if (getDiceValue) {
      const v = await Promise.resolve(getDiceValue())
      return Math.max(1, Math.min(6, Math.floor(v))) as DiceFaceValue
    }
    return (Math.floor(Math.random() * 6) + 1) as DiceFaceValue
  }, [getDiceValue])

  const handleStop = useCallback(async () => {
    try {
      const elapsed = Date.now() - openedAtRef.current
      if (elapsed < MIN_SPIN_MS) {
        await new Promise((r) => setTimeout(r, MIN_SPIN_MS - elapsed))
      }
      const v = await fetchValue()
      setValue(v)
      setIsRolling(false)
      setError(null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError('サイコロの目の取得に失敗しました。もう一度お試しください。')
      setIsRolling(false)
    }
  }, [fetchValue])

  const rollingFace: DiceFaceValue = useMemo(() => {
    if (!isRolling) return value ?? 1
    const n = ((Math.floor(Date.now() / 60) % 6) + 1) as DiceFaceValue
    return n
  }, [isRolling, value])

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

          <motion.div
            className="rounded-xl bg-blue-default/10 p-6"
            animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isRolling
                ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                : { duration: 0.4, ease: 'easeOut' }
            }
          >
            <DiceFace value={rollingFace} size={160} />
          </motion.div>

          <div className="mt-4 h-8 flex items-center">
            {!isRolling && value !== null && (
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{value}マスすすむ</div>
            )}
          </div>

          <div className="mt-6">
            {isRolling ? (
              <button
                type="button"
                onClick={handleStop}
                className="px-10 py-3 rounded-md bg-blue-default text-white text-lg shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="サイコロを止める"
              >
                サイコロを止める
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-3 rounded-md bg-blue-default text-white text-lg shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                マップに戻る
              </button>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
