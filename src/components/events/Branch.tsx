'use client'

import { useGameStore } from '@/lib/game/store'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

type Choice = 'a' | 'b'

type BranchProps = {
  onClose?: () => void
}

const PAGE_COPY: Record<number, { title: string; message: string }> = {
  1: { title: '【条件分岐マス：1ページ目】', message: 'AかBを選んで次のページへ進みます。' },
  2: { title: '【条件分岐マス：2ページ目】', message: 'AかBを選んで次のページへ進みます。' },
  3: { title: '【条件分岐マス：3ページ目】', message: 'AかBを選んで次のページへ進みます。' },
}

export default function Branch({ onClose }: BranchProps) {
  const router = useRouter()
  const branchCount = useGameStore((s) => s.branchCount)
  const incrementBranch = useGameStore((s) => s.incrementBranch)

  // 「今踏んでいる分岐」が何回目かでページを決める
  const currentPage = useMemo(() => {
    const p = branchCount + 1
    return p < 1 ? 1 : p
  }, [branchCount])

  const nextPage = currentPage + 1
  const copy = PAGE_COPY[currentPage] ?? {
    title: `【条件分岐マス：${currentPage}ページ目】`,
    message: 'AかBを選んで次のページへ進みます。',
  }

  const go = (choice: Choice) => {
    incrementBranch()
    onClose?.()
    router.push(`/game/${nextPage}/${choice}`)
  }

  return (
    <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
      <div className="rounded-xl border-2 border-white/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
        <p className="font-bold mb-2">{copy.title}</p>
        <p className="text-sm md:text-base">{copy.message}</p>

        <div className="mt-3 flex gap-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white"
            onClick={() => go('a')}
            aria-label="A で次ページへ進む"
          >
            Aで進む
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white"
            onClick={() => go('b')}
            aria-label="B で次ページへ進む"
          >
            Bで進む
          </button>
        </div>
      </div>

      {/* 吹き出し三角 */}
      <div className="relative">
        <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
      </div>
    </div>
  )
}
