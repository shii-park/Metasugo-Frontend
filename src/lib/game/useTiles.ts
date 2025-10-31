// src/lib/game/useTiles.ts
'use client'

import { useEffect, useMemo, useState } from 'react';

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

// export function useTiles(src: string = '/api/tiles'): UseTilesResult {
export function useTiles(src: string = '/tiles.json'): UseTilesResult {
  const [tiles, setTiles] = useState<Tile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(src, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Invalid tiles format (not array)')

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
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load tiles')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

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
