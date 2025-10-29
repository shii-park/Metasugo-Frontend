'use client'

import { useGameStore } from '@/lib/game/store'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type Choice = 'a' | 'b'
type BranchProps = { onClose?: () => void }

const PAGE_COPY: Record<number, { title: string;}> = {
  1: { title: '【クイズマス】',},
  2: { title: '【クイズマス】',},
  3: { title: '【クイズマス】',},
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

  const [showContent, setShowContent] = useState(false)

  const [finalChoice, setFinalChoice] = useState<Choice | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

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

  const handleAdvance = () => {
    if (!showContent && !resultMessage){
      setShowContent(true);
    }else if (!showContent && resultMessage){
      setRouting(false);
      onClose?.();
    }
  };

  const go = (choice: Choice) => {
    if (submitting || handledRef.current) return
    handledRef.current = true
    setSubmitting(true)

    const isCorrect = choice === 'a'
    const finalMessage = isCorrect
      ? '正解'
      : '不正解';

    setFinalChoice(choice);
    setResultMessage(finalMessage);
    setShowContent(false);

    incrementBranch()
  }

  const isTitleOnly = !showContent

  return (
    <div className='absolute z-50 inset-0 cursor-pointer' onClick={isTitleOnly ? handleAdvance : undefined}>
        {isTitleOnly ? (
          <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
          <div className="rounded-xl border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
            <p className="font-bold mb-2 text-[#5B7BA6] text-2xl">{resultMessage ?? copy.title}</p>
          </div>
          </div>
        ) : (
          <div className='flex justify-center items-center w-full h-full'>
            <div className="rounded-[6] border-2 border-amber-100 bg-white/90 backdrop-blur-sm shadow-lg p-5 w-5/8">
              <p className="font-bold mb-2 text-[#5B7BA6] text-2xl p-5 text-center">
                よしくんの苗字は？
              </p>
              <div className="flex gap-4 mt-4 justify-center items-center">
              <div className="rounded-xl border-2  bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-[15%] text-center">
                <button
                  type="button"
                  className="flex font-bold mb-2 text-white text-2xl w-full items-center justify-center"
                  onClick={() => go('a')}
                  aria-label="A を選択"
                  disabled={submitting}
                >
                  吉元
                </button>
              </div>
              <div className="rounded-xl border-2  bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-[15%]  text-center">
                <button
                  type="button" 
                  className="font-bold mb-2 text-white text-2xl"
                  onClick={() => go('b')}
                  aria-label="B を選択"
                  disabled={submitting}
                >
                  吉本
                </button>
                </div>
              </div>
            </div>
          </div>
        )}
      <div className="relative">
        <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
      </div>
    </div>
  )
}

