'use client'
import { useGameStore } from '@/lib/game/store'
import { useRouter } from 'next/navigation'

type FinishProps = {
  title?: string
  message?: string
  onClose?: () => void
}

export default function Finish({
  title = 'ゴール！',
  message = 'おつかれさま！ゲームはここで終了です。',
  onClose,
}: FinishProps) {
  const router = useRouter()
  const setRouting = useGameStore((s) => s.setRouting)

  const goHome = () => {
    setRouting(true)
    onClose?.()
    router.push('/') // 必要なら結果ページに変更: /result など
  }

  const restart = () => {
    setRouting(true)
    onClose?.()
    router.push('/game/1') // リトライ先（任意で調整）
  }

  return (
    <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
      <div className="rounded-xl border-2 border-white/90 bg-white/95 backdrop-blur-sm shadow-lg p-4 md:p-5">
        <p className="font-bold mb-2">{title}</p>
        <p className="text-sm md:text-base">{message}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white"
            onClick={goHome}
          >
            タイトルへ
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-green-600 text-white"
            onClick={restart}
          >
            もう一度
          </button>
        </div>
      </div>
    </div>
  )
}
