'use client'

import { useGameStore } from '@/lib/game/store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type Choice = 'a' | 'b'
type BranchProps = { onClose?: () => void }

const PAGE_COPY: Record<number, { title: string; message: string }> = {
  1: { title: '【条件分岐マス：1ページ目】', message: 'AかBを選んで次のページへ進みます。' },
  2: { title: '【条件分岐マス：2ページ目】', message: 'AかBを選んで次のページへ進みます。' },
  3: { title: '【条件分岐マス：3ページ目】', message: 'AかBを選んで次のページへ進みます。' },
}

// /game/<page>/<a|b> から page を抜く（末尾スラッシュやクエリがあってもOK）
function getCurrentPageFromPath(pathname: string): number {
  const m = pathname.match(/\/game\/(\d+)\/[ab](?:\/)?$/)
  if (m && m[1]) {
    const n = Number(m[1])
    return Number.isFinite(n) && n >= 1 ? n : 1
  }
  // 末尾にクエリ/ハッシュがある場合の保険
  const path = pathname.split('?')[0]!.split('#')[0]!
  const m2 = path.match(/\/game\/(\d+)\/[ab](?:\/)?$/)
  if (m2 && m2[1]) {
    const n = Number(m2[1])
    return Number.isFinite(n) && n >= 1 ? n : 1
  }
  return 1
}

export default function Branch({ onClose }: BranchProps) {
  const router = useRouter()
  const pathname = usePathname()

  const setRouting = useGameStore((s) => s.setRouting)
  const incrementBranch = useGameStore((s) => s.incrementBranch)

  const currentPage = useMemo<number>(() => getCurrentPageFromPath(pathname), [pathname])
  const nextPage = useMemo<number>(() => currentPage + 1, [currentPage])

  useEffect(() => {
    void router.prefetch(`/game/${nextPage}/a`)
    void router.prefetch(`/game/${nextPage}/b`)
  }, [router, nextPage])

  const copy = PAGE_COPY[currentPage] ?? {
    title: `【条件分岐マス：${currentPage}ページ目】`,
    message: 'AかBを選んで次のページへ進みます。',
  }

  const [submitting, setSubmitting] = useState(false)
  const handledRef = useRef(false)

  const go = (choice: Choice) => {
    if (submitting || handledRef.current) return
    handledRef.current = true
    setSubmitting(true)

    setRouting(true)
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
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            onClick={() => go('a')}
            aria-label="A で次ページへ進む"
            disabled={submitting}
          >
            Aで進む
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
            onClick={() => go('b')}
            aria-label="B で次ページへ進む"
            disabled={submitting}
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
