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
  message = '',
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
    <div className="fixed inset-0 w-full h-full backdrop-blur-sm flex items-center justify-center z-50">
      <div className="
        rounded-md border-2 border-[#5B7BA6] bg-[#E3DECF]
        w-[min(50vw,600px)] h-[min(80vh,500 px)]
        flex flex-col items-center justify-center
      ">
        <div className="text-[#5B7BA6] text-3xl font-bold m-4">ゴール</div>
        <div className="font-bold rounded-md bg-white text-l text-[#5B7BA6] flex-col items-center justify-center px-6 py-4 mb-4 w-3/5 mx-auto">
          <p className="flex justify-between w-full">
            <span>合計金額</span>
            <span>○○円</span>
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
    // <div className="flex justify-center items-center w-full z-100">
    //   <div className="rounded-xl border-2 border-white/90 bg-white/95 w-4/5 backdrop-blur-sm shadow-lg p-4 md:p-5">
    //     <p className="font-bold mb-2">{title}</p>
    //     <div className="font-bold bg-white text-l text-[#5B7BA6] flex items-center justify-center py-4 mx-auto">
    //       <p className="flex justify-between w-full">
    //         <span>合計金額</span>
    //         <span>{message}円</span>
    //       </p>
    //     </div>
    //     <div className="mt-3 flex gap-2">
    //       <button
    //         type="button"
    //         className="px-4 py-2 rounded bg-blue-600 text-white"
    //         onClick={goHome}
    //       >
    //         ホームに戻る
    //       </button>
    //     </div>
    //   </div>
    // </div>
  )
}
