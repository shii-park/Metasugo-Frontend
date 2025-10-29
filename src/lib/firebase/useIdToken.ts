'use client'

import { getIdToken, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * FirebaseのIDトークンをリアクティブに返すフック
 *
 * - tokenLoading: グローバルauthまたはトークン取得中ならtrue
 * - token: 取得できたら文字列、未ログインや未取得ならnull
 *
 * このフックは any / unknown は使ってないので ESLint 的にも安全なはず。
 */
export function useIdToken(): { token: string | null; tokenLoading: boolean } {
  const { user, loading } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true

    async function update(u: User | null, globalLoading: boolean) {
      // まだAuthContext側が"誰なのか判定中"の場合
      if (globalLoading) {
        if (active) {
          setTokenLoading(true)
          setToken(null)
        }
        return
      }

      // ログインしてない場合
      if (!u) {
        if (active) {
          setToken(null)
          setTokenLoading(false)
        }
        return
      }

      // ログイン済み → IDトークン取得
      const t = await getIdToken(u, /* forceRefresh */ false)

      if (active) {
        setToken(t)
        setTokenLoading(false)
      }
    }

    update(user ?? null, loading)

    return () => {
      active = false
    }
  }, [user, loading])

  return { token, tokenLoading }
}
