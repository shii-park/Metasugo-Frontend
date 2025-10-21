'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type Props = {
  iconSrc?: string
  items?: string[]
  className?: string
  sizePct?: number
  onSelect?: (item: string) => void
}

export default function SettingsMenu({
  iconSrc = '/setting.svg',
  items = ['ここはあとで考える'],
  className = '',
  sizePct = 4,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

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
        className='w-full p-2 aspect-square grid place-items-centerrounded-lg rounded bg-blue-default text-white overflow-hidden outline-non'>
        <span className='relative w-full h-full p-[12%]'>
          {' '}
          <Image src={iconSrc} alt='' fill className='object-contain' />
        </span>
        <span className='sr-only'>設定</span>
      </button>

      {open && (
        <div
          role='menu'
          aria-label='設定メニュー'
          className='absolute right-0 mt-2 w-[clamp(160px,22vw,240px)] rounded-lg bg-white shadow-lg border border-gray-200 z-20 animate-in fade-in slide-in-from-top-1'
        >
          <ul className='py-2'>
            {items.map((item) => (
              <li key={item}>
                <button
                  role='menuitem'
                  className='w-full text-left px-4 py-2 text-sm hover:bg-brown-light/40 transition'
                  onClick={() => {
                    setOpen(false)
                    if (onSelect) onSelect(item)
                    else alert(`${item} を選択`)
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
