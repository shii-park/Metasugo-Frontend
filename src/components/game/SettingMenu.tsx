'use client'
import Image from 'next/image';
import Link from "next/link";
import { useRef, useState } from 'react';
import { useAuth } from "../../context/AuthContext";

function MenuButton({
  src,
  label,
  onClick,
}: {
  src: string
  label: string
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center mb-4">
      <button
        onClick={onClick}
        className="rounded-md bg-[#5B7BA6] p-4 mx-4 hover:opacity-80 transition"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="w-12 h-12" />
      </button>
      <div className="text-md text-[#5B7BA6] font-bold">{label}</div>
    </div>
  )
}

export default function SettingsMenu({
  iconSrc = '/setting.svg',
  className = '',
  sizePct = 4,
}: {
  iconSrc?: string
  className?: string
  sizePct?: number
}) {
  const  { user }  = useAuth();
  const [open, setOpen] = useState(false)
  const [activeView, setActiveView] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const pct = Math.max(0, Math.min(100, sizePct))

  const renderContent = () => {
    switch (activeView) {
      case 'game':
        return (
          <div className="flex flex-col justify-center items-center text-[#5B7BA6] font-bold text-lg p-4">
              ゲーム説明を表示
          </div>
        )
      case 'account':
        return (
          <div className="text-[#5B7BA6] w-full h-full">
            <div className="flex flex-col justify-center items-center">
              <div className="font-bold text-2xl mb-3">
                アカウント
              </div>
              <div className="rounded-full bg-[#5B7BA6] p-4 mb-3">
                <img
                  src="/person.svg"
                  className="w-16 h-16"
                />
              </div>
              <div className="mb-4">
                {user?.email ?? "ゲストユーザー"}
              </div>
              <button
              onClick={() => setActiveView(null)}
              className="mb-4 px-8 py-1 bg-[#5B7BA6] text-2xl font-bold text-white rounded-md hover:opacity-80"
              >
                閉じる
              </button>
            </div>
          </div>
        )
      case 'records':
        return (
          <div className="text-[#5B7BA6] w-full">
            <div className="flex flex-col justify-center items-center w-full mb-4">
              <div className="font-bold text-2xl mx-12 mb-5">
                過去記録
              </div>
              <div className="flex flex-col bg-white rounded-md p-2 mx-4 mb-4 w-4/5">
                <div className="">
                  最高金額
                </div>
                <div className="flex justify-end">
                  〇〇〇〇〇〇円
                </div>
                <div className="">
                  周回回数
                </div>
                <div className="flex justify-end">
                  〇〇回
                </div>
              </div>
              <button
                onClick={() => setActiveView(null)}
                className="px-8 py-1 bg-[#5B7BA6] text-2xl font-bold text-white rounded-md hover:opacity-80"
              >
                閉じる
              </button>
            </div>
          </div>
        )
      case 'home':
        return (
          <div className="text-[#5B7BA6]">
            <div className="flex flex-col justify-center items-center px-12 pb-4">
              <div className="font-bold text-2xl mb-5">
                ホームに戻りますか？
              </div>
              <div className="rounded-full bg-[#5B7BA6] p-4 mb-5">
                <img
                  src="/home.svg"
                  className="w-16 h-16"
                />
              </div>
              <Link href="/" className="m-2 py-1 px-8 text-2xl text-white font-bold bg-[#5B7BA6] rounded-md">
                戻る
              </Link>
              <button
                onClick={() => setActiveView(null)}
                className="text-lg text-[#5B7BA6] rounded-md hover:opacity-80"
              >
                キャンセル
              </button>
            </div>
          </div>
        )
      default:
        return (
          <>
            {/* 初期メニュー */}
            <div className="px-12">
              <div className="flex justify-center">
                <MenuButton
                  src="/question.svg"
                  label="ゲーム説明"
                  onClick={() => setActiveView('game')}
                />
                <MenuButton
                  src="/person.svg"
                  label="アカウント"
                  onClick={() => setActiveView('account')}
                />
              </div>
              <div className="flex justify-center">
                <MenuButton
                  src="/book.svg"
                  label="過去記録"
                  onClick={() => setActiveView('records')}
                />
                <MenuButton
                  src="/home.svg"
                  label="ホーム"
                  onClick={() => setActiveView('home')}
                />
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div
      ref={ref}
      className={`relative z-10 ${className}`}
      style={{ width: `clamp(48px, ${pct}%, 72px)` }}
    >
      <button
        type="button"
        aria-label="設定メニュー"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full p-2 aspect-square grid place-items-center rounded-lg bg-blue-default text-white overflow-hidden outline-none"
      >
        <span className="relative w-full h-full p-[12%]">
          <Image src={iconSrc} alt="" fill className="object-contain" />
        </span>
        <span className="sr-only">設定</span>
      </button>

      {open && (
        <div className="fixed inset-0 w-full h-full backdrop-blur-sm flex items-center justify-center z-50">
          <div className="
            rounded-md border-2 border-[#5B7BA6] bg-[#E3DECF]
            w-[min(50vw,600px)] h-[min(80vh,500 px)]
            flex flex-col
          ">
            <div className="flex justify-end">
              <button
                onClick={() => {
                    setOpen(false);
                    setActiveView(null);
                }}
                className="pt-2 pr-2"
              >
                <img
                  src="/close.svg"
                  alt="閉じる"
                  className="w-8 h-8 hover:opacity-70 transition"
                />
              </button>
            </div>
            <div>{renderContent()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
