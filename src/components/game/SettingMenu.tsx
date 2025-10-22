'use client'
import Image from 'next/image'
import { useState, useRef, ReactNode } from 'react'

type Props = {
  iconSrc?: string
  items?: ReactNode[]
  className?: string
  sizePct?: number
  onSelect?: (item: string) => void
}

export default function SettingsMenu({
  iconSrc = '/setting.svg',
  className = '',
  sizePct = 4,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const pct = Math.max(0, Math.min(100, sizePct))

  return (
    <div
      ref={ref}
      className={`relative z-10 ${className}`}
      style={{ width: `clamp(48px, ${pct}%, 72px)` }}
    >
      <button
        type='button'
        aria-label='設定メニュー'
        aria-haspopup='menu'
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className='w-full p-2 aspect-square grid place-items-center rounded-lg bg-blue-default text-white overflow-hidden outline-none'
      >
        <span className='relative w-full h-full p-[12%]'>
          <Image src={iconSrc} alt='' fill className='object-contain' />
        </span>
        <span className='sr-only'>設定</span>
      </button>

      {open && (
        <div className="fixed inset-0 w-full h-full backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-md border-2 border-[#5B7BA6] bg-[#E3DECF]">
            <div className="p-2">
              <div className="flex justify-end">
                <button onClick={() => setOpen(false)}>
                  <img
                    src="/close.svg"
                    alt="閉じる"
                    className="w-8 h-8 hover:opacity-70 transition"
                  />
                </button>
              </div>
              <div className="px-12">
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <button className="rounded-md bg-[#5B7BA6] p-4 mx-4 mt-4">
                      <img
                        src="/question.svg"
                        alt="ゲーム説明"
                        className="w-16 h-16"
                      />
                    </button>
                    <div className="text-md text-[#5B7BA6] font-bold">
                      ゲーム説明
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <button className="rounded-md bg-[#5B7BA6] p-4 mx-4 mt-4">
                      <img
                        src="/person.svg"
                        alt="アカウント"
                        className="w-16 h-16"
                      />
                    </button>
                    <div className="text-md text-[#5B7BA6] font-bold">
                      アカウント
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="flex flex-col items-center mb-2">
                    <button className="rounded-md bg-[#5B7BA6] p-4 mx-4 mt-4">
                      <img
                        src="/book.svg"
                        alt="過去記録"
                        className="w-16 h-16"
                      />
                    </button>
                    <div className="text-md text-[#5B7BA6] font-bold">
                      過去記録
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <button className="rounded-md bg-[#5B7BA6] p-4 mx-4 mt-4">
                      <img
                        src="/home.svg"
                        alt="ホーム"
                        className="w-16 h-16"
                      />
                    </button>
                    <div className="text-md text-[#5B7BA6] font-bold">
                      ホーム
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}