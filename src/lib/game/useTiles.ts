// src/lib/game/useTiles.ts
'use client'

import { useEffect, useMemo, useState } from 'react'

// ★ Firebase Authから必要なモジュールをインポート
import { getIdToken } from 'firebase/auth'
import { auth } from '@/firebase' // firebase.ts から auth インスタンスをインポート

/** タイル効果の型定義 */
export type TileEffect =
  | { type: 'no_effect' }
  | { type: 'profit'; amount: number }
  | { type: 'loss'; amount: number }
  | { type: 'quiz'; quiz_id: number; amount: number }
  | { type: 'branch' }
  | { type: 'overall' }
  | { type: 'neighbor' }
  | { type: 'require' }
  | { type: 'gamble' }
  // バックエンドに将来追加される可能性も考慮して fallback
  | Record<string, unknown>

export type Tile = {
  id: number
  kind: string
  detail: string
  effect: TileEffect
  prev_ids: number[]
  next_ids: number[]
}

export type UseTilesResult = {
  tiles: Tile[] | null
  byId: Map<number, Tile>
  loading: boolean
  error: string | null
}

// ★ 修正: デフォルトのsrcを '/tiles' (APIエンドポイント) に変更
export function useTiles(src: string = '/tiles'): UseTilesResult {
  const [tiles, setTiles] = useState<Tile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // ★ 修正: 認証トークンを取得してfetchするロジック
    const fetchTiles = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1. 現在のログインユーザーを取得
        const user = auth.currentUser
        if (!user) {
          throw new Error('Not logged in') // ログインしていない場合はエラー
        }

        // 2. 認証トークンを取得 (shimの定義 'getIdToken(user)' に合わせる)
        const token = await getIdToken(user)

        // 3. 認証ヘッダーを付けてAPIを叩く
        const res = await fetch(src, {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`, // ★ 認証ヘッダーを追加
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch tiles: HTTP ${res.status}`)
        }

        const data = await res.json()
        if (!Array.isArray(data)) {
          throw new Error('Invalid tiles format (not array)')
        }

        // (以降のパース処理は変更なし)
        const parsed: Tile[] = data.map((t) => ({
          id: t.id,
          kind: t.kind,
          detail: t.detail,
          effect: t.effect ?? { type: 'no_effect' },
          prev_ids: t.prev_ids ?? [],
          next_ids: t.next_ids ?? [],
        }))

        if (!cancelled) setTiles(parsed)
      } catch (e) {
        console.error('[useTiles] Error:', e) // ★ エラーログを強化
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load tiles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTiles() // ★ 修正した非同期関数を実行

    return () => {
      cancelled = true
    }
  }, [src]) // srcが変わった時だけ再実行

  const byId = useMemo(() => {
    const m = new Map<number, Tile>()
    if (tiles) for (const t of tiles) m.set(t.id, t)
    return m
  }, [tiles])

  return { tiles, byId, loading, error }
}