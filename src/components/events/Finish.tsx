'use client'

import { useGameStore } from '@/lib/game/store'
import { getActiveSocket } from '@/lib/game/wsClient'
import { useRouter } from 'next/navigation'

type FinishProps = {
  title?: string
  message?: string
  onClose?: () => void
}

export default function Finish({
  title = 'ゴール！',
  onClose,
}: FinishProps) {
  const router = useRouter()
  const setRouting = useGameStore((s) => s.setRouting)

  // 🪙 合計金額を store から取得
  const totalMoney = useGameStore((s) => s.money) // ← store 側で money を保持している前提
  // もし store に money がない場合は props 経由に変更も可

  const goHome = () => {
    getActiveSocket()?.close()
    setRouting(true)
    onClose?.()
    router.push('/')
  }

  const restart = () => {
    getActiveSocket()?.close()
    setRouting(true)
    onClose?.()
    router.push('/game/1')
  }

  return (
    <div className="fixed inset-0 w-full h-full backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="
        rounded-md border-2 border-[#5B7BA6] bg-[#E3DECF]
        w-[min(50vw,600px)] h-[min(80vh,500px)]
        flex flex-col items-center justify-center
      "
      >
        <div className="text-[#5B7BA6] text-3xl font-bold m-4">{title}</div>

        {/* 💰 合計金額表示 */}
        <div className="font-bold rounded-md bg-white text-l text-[#5B7BA6] flex-col items-center justify-center px-6 py-4 mb-4 w-3/5 mx-auto">
          <p className="flex justify-between w-full">
            <p>これでゲームは終了です！</p>
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-1 m-4 rounded bg-[#5B7BA6] text-white"
          onClick={goHome}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
