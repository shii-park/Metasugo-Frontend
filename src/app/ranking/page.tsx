'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useAuth } from './../../context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const ranks = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => i + 1)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

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
              <Link href={'/'} className='text-2xl font-bold text-blue-default'>
                戻る
              </Link>
            </div>
          </div>

          <div className='flex flex-col justify-center items-center border-2 border-white w-full h-full'>
            <div className='md:text-4xl text-xl font-bold text-blue-default mb-4'>
              ランキング
            </div>
            <div className='w-4/5 h-80 overflow-scroll border-2 rounded border-blue-default flex flex-col align-items bg-white '>
              {ranks.map((rank) => (
                <div
                  key={rank}
                  className='w-full flex flex-row px-8 py-4 justify-around border-b border-blue-default/20 last:border-b-0'
                >
                  <div className='w-full flex flex-row'>
                    <p className='px-4 md:text-3xl text-md font-bold text-blue-default whitespace-nowrap'>
                      {rank}位
                    </p>
                    <p className='px-4 md:text-3xl text-md font-bold text-blue-default'>
                      ユーザー名
                    </p>
                  </div>
                  <p className='w-full flex justify-end px-8 md:text-3xl text-md font-bold text-blue-default'>
                    ○○円
                  </p>
                </div>
              ))}
            </div>
            <div className='w-4/5 flex flex-row px-8 py-4 justify-around'>
              <div className='w-full flex flex-row '>
                <p className='px-4 md:text-3xl text-xl font-bold text-blue-default'>
                  自分の順位
                </p>
                <p className='px-4 md:text-3xl text-xl font-bold text-blue-default'>
                  1位
                </p>
              </div>
              <p className='w-full flex justify-end px-8 md:text-3xl text-xl font-bold text-blue-default'>
                ○○円
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
