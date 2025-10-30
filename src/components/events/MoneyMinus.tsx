'use client'

import { useGameStore } from '@/lib/game/store'
import { useMemo, useState } from 'react'

type Props = { onClose: () => void }

export default function MoneyMinus({ onClose }: Props) {
  const [showContent, setShowContent] = useState(false)

  const moneyChange = useGameStore((s) => s.moneyChange)
  const clearMoneyChange = useGameStore((s) => s.clearMoneyChange)

  // 絶対値で表示（null/正なら0に）
  const deltaAbs = useMemo(() => {
    const d = moneyChange?.delta ?? 0
    return d < 0 ? Math.abs(d) : 0
  }, [moneyChange])

  const handleAdvance = () => {
    if (showContent) {
      clearMoneyChange()
      onClose()
    } else {
      setShowContent(true)
    }
  }

  const isTitleOnly = !showContent
  const contentLines = [`所持金が ${deltaAbs.toLocaleString()} 円減った`]

  return (
    <div className="absolute z-50 inset-0 cursor-pointer" onClick={handleAdvance}>
      <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
        <div className="rounded-xl border-2 border-white/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
          {isTitleOnly ? (
            <p className="font-bold mb-2 text-[#5B7BA6]">【お金減少マス】</p>
          ) : (
            <div className="font-bold text-sm md:text-base text-[#5B7BA6]">
              {contentLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
        </div>
      </div>
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}
