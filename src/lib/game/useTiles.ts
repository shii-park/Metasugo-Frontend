// src/lib/game/useTiles.ts
'use client'

import { auth } from '@/firebase'
import { getIdToken } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'

/** タイルの種類（見た目/分類） */
export type TileKind =
  | 'profit'
  | 'loss'
  | 'quiz'
  | 'branch'
  | 'overall'
  | 'neighbor'
  | 'require'
  | 'gamble'
  | 'goal'

/** タイル効果の型定義（ロジック寄り） */
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
  | Record<string, unknown>

/** ランタイムガード：APIから来た文字列を TileKind に正規化 */
const TILE_KINDS = [
  'profit',
  'loss',
  'quiz',
  'branch',
  'overall',
  'neighbor',
  'require',
  'gamble',
  'goal',
] as const

const isTileKind = (v: unknown): v is TileKind =>
  typeof v === 'string' && (TILE_KINDS as readonly string[]).includes(v)

export type Tile = {
  id: number
  kind: TileKind        // ← string から厳密型へ
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

/** 認証付きでタイル一覧を取得するフック */
export function useTiles(src: string = '/tiles'): UseTilesResult {
  const [tiles, setTiles] = useState<Tile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchTiles = async () => {
      setLoading(true)
      setError(null)

      try {
        const user = auth.currentUser
        if (!user) throw new Error('Not logged in')

        const token = await getIdToken(user)

        const res = await fetch(src, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to fetch tiles: HTTP ${res.status}`)

        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Invalid tiles format (not array)')

        const parsed: Tile[] = data.map((t) => ({
          id: t.id,
          kind: isTileKind(t.kind) ? t.kind : 'overall', // ← 不正値はフォールバック
          detail: t.detail,
          effect: t.effect ?? { type: 'no_effect' },
          prev_ids: t.prev_ids ?? [],
          next_ids: t.next_ids ?? [],
        }))

        if (!cancelled) setTiles(parsed)
      } catch (e) {
        console.error('[useTiles] Error:', e)
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load tiles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTiles()
    return () => {
      cancelled = true
    }
  }, [src])

  const byId = useMemo(() => {
    const m = new Map<number, Tile>()
    if (tiles) for (const t of tiles) m.set(t.id, t)
    return m
  }, [tiles])

  return { tiles, byId, loading, error }
}
