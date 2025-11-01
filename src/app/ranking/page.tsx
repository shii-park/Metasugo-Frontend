'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from './../../context/AuthContext'

interface Player {
  playerID: string
  displayName: string
  money: number
  finishedAt: string
}

export default function Ranking() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  // --- ログインチェック ---
  useEffect(() => {
    console.log('🌀 useEffect: user/loading changed', { user, loading })
    if (!loading && !user) {
      console.log('🚪 未ログインのため /signin にリダイレクト')
      router.push('/signin')
    }
  }, [loading, router, user])

  // --- ランキング取得 ---
  useEffect(() => {
    if (!user) {
      console.log('⏸️ user がまだ存在しません。fetch 中止')
      return
    }

    const fetchRanking = async () => {
      try {
        const token = await user.getIdToken()
        console.log('✅ 取得した ID トークン:', token)

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ORIGIN}/ranking`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log('📡 fetch /ranking 結果', { ok: res.ok, status: res.status })

        if (!res.ok) throw new Error(`ランキングの取得に失敗しました (status: ${res.status})`)

        const data: Player[] = await res.json()
        console.log('📦 取得したランキングデータ:', data)

        // 所持金順に降順ソート
        data.sort((a, b) => b.money - a.money)
        setPlayers(data)
        console.log('🔽 ソート後のランキングデータ:', data)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('❌ ランキング取得エラー:', error)
        setFetchError(error.message)
      }
    }

    fetchRanking()
  }, [user])

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

  // 自分の順位を displayName で検索
  const myRank = players.findIndex((p) => p.displayName === user.displayName) + 1
  const myMoney = players.find((p) => p.displayName === user.displayName)?.money ?? 0

  console.log('👤 自分の順位と所持金', {
    displayName: user.displayName,
    myRank,
    myMoney,
  })

  return (
    <div>
      {/* 縦向き警告 */}
      <div className='portrait:fixed portrait:inset-0 portrait:bg-[#5B7BA6] portrait:text-white portrait:text-2xl portrait:flex portrait:items-center portrait:justify-center portrait:z-50 portrait:overflow-hidden portrait:touch-none'>
        画面を横向きにしてください
      </div>

      <div className='fixed inset-0 flex h-[100dvh] items-center justify-center bg-black overflow-hidden'>
        <div className='relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video bg-[#E3DECF] py-2 px-4'>
          {/* ヘッダー */}
          <div className='flex'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='/logo.svg' alt='ロゴ' className='absolute top-3 left-10' />
            <div className='flex flex-col absolute top-8 right-10'>
              <Link href='/' className='text-xl font-bold text-blue-default'>
                戻る
              </Link>
            </div>
          </div>

          {/* ランキング本体 */}
          <div className='flex flex-col justify-center items-center border-2 border-white w-full h-full'>
            <div className='md:text-4xl text-xl font-bold text-blue-default mb-4'>
              ランキング
            </div>

            {fetchError ? (
              <p className='text-red-600'>{fetchError}</p>
            ) : players.length === 0 ? (
              <p className='text-gray-600'>ランキングデータがありません</p>
            ) : (
              <div className='w-2/3 h-2/5 overflow-scroll border-2 rounded border-blue-default flex flex-col align-items bg-white'>
                {players.map((p, idx) => (
                  <div
                    key={p.playerID}
                    className='w-full flex flex-row px-4 py-4 justify-around border-b border-blue-default/20 last:border-b-0'
                  >
                    <div className='w-full flex flex-row'>
                      <p className='px-4 md:text-2xl text-md font-bold text-blue-default whitespace-nowrap'>
                        {idx + 1}位
                      </p>
                      <p className='px-4 md:text-xl text-md w-full font-bold text-blue-default'>
                        {p.displayName}
                      </p>
                    </div>
                    <p className='whitespace-nowrap flex justify-end px-4 md:text-2xl text-md font-bold text-blue-default'>
                      {p.money.toLocaleString()}円
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 自分の順位欄 */}
            <div className='w-4/5 flex flex-row px-8 py-4 justify-around mt-4'>
              <div className='w-full flex flex-row'>
                <p className='whitespace-nowrap px-4 md:text-2xl text-xl font-bold text-blue-default'>
                  自分の順位
                </p>
                <p className='whitespace-nowrap px-4 md:text-2xl text-xl font-bold text-blue-default'>
                  {myRank > 0 ? `${myRank}位` : '未ランク'}
                </p>
              </div>
              <p className='whitespace-nowrap w-full flex justify-end px-8 md:text-2xl text-xl font-bold text-blue-default'>
                {myMoney.toLocaleString()}円
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
