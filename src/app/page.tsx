'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react' // useState をインポート
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/authService'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [bestScore, setBestScore] = useState<number | null>(null) // 最高金額を保持するstate
  const [scoreError, setScoreError] = useState<string | null>(null) // エラーメッセージを保持するstate

  const handleLogout = async () => {
    await logout()
    router.push('/signin')
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin') // ログインしていなければ自動遷移
    }
  }, [user, loading, router])

  // /bestscore から最高金額を取得するuseEffect
  useEffect(() => {
    if (user) {
      const fetchBestScore = async () => {
        try {
          const token = await user.getIdToken()
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ORIGIN}/bestscore`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!res.ok) {
            throw new Error('最高金額の取得に失敗しました')
          }

          const data = await res.json()
          setBestScore(data.money)
        } catch (error) {
          console.error(error)
          setScoreError(error instanceof Error ? error.message : '不明なエラーが発生しました')
        }
      }

      fetchBestScore()
    }
  }, [user]) // user オブジェクトが利用可能になったら実行

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center text-2xl bg-[#5B7BA6]'>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className='flex h-screen items-center justify-center text-2xl bg-[#5B7BA6]'>
        <p>ログインページに移動中...</p>
      </div>
    )
  }

  return (
    // ログイン確認用
    // <div className="flex flex-col items-center justify-center h-screen bg-[#E3DECF]">
    //   <h1 className="text-3xl font-bold text-[#5B7BA6] mb-6">
    //     ようこそ、{user.email} さん！
    //   </h1>

    // </div>
    <div>
      <div className='portrait:fixed portrait:inset-0 portrait:bg-[#5B7BA6] portrait:text-white portrait:text-2xl portrait:flex portrait:items-center portrait:justify-center portrait:z-50 portrait:overflow-hidden portrait:touch-none'>
        画面を横向きにしてください
      </div>

      <div className='fixed inset-0 flex h-[100dvh] items-center justify-center bg-black overflow-hidden'>
        <div className='relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video bg-[#E3DECF] py-2 px-4'>
          <div className='flex'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src='/logo.svg'
              alt='ロゴ'
              className='absolute top-3 left-10'
            />
            <div className='flex flex-col absolute top-8 right-10'>
              <button
                onClick={handleLogout}
                className='text-[#5B7BA6] text-sm flex justify-end'
              >
                ログアウト
              </button>
              <div className='text-[#5B7BA6] text-xs font-bold justify-end'>{user.displayName}</div>
            </div>
          </div>

          <div className='flex justify-center items-center border-2 border-white w-full h-full'>
            <div className='relative mx-4 w-full h-hull'>
              <div className='font-bold text-3xl text-[#5B7BA6] flex items-center justify-center text-center mb-4'>
                わくわく！
                <br />
                高専教員なりきりゲーム
              </div>
              <div className='font-bold text-2xl text-[#5B7BA6] flex items-center justify-center mb-4'>
                ～お前も高専教員にならないか～
              </div>
              <div className='font-bold bg-white text-l text-[#5B7BA6] flex flex-col items-center justify-center px-6 py-4 w-2/5 mx-auto'>
                <p className='flex justify-between w-full'>
                  <span>あなたの最高金額</span>
                  <span>
                    {scoreError ? '取得失敗' : bestScore !== null ? `${bestScore.toLocaleString()}円` : '読み込み中...'}
                  </span>
                </p>
                <p className='flex justify-center items-center border-b '>
                  <Link href={'/ranking'}>ランキングページはこちら</Link>
                </p>
              </div>
              <div className='flex justify-center items-center mt-8 text-2xl'>
                <Link
                  className='rounded-lg bg-[#5B7BA6] font-bold text-white px-12 py-1'
                  href={'/game/1'}
                >
                  スタート
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
