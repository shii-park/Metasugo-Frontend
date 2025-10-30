// src/lib/game/useTiles.ts
'use client'

import { useEffect, useMemo, useState } from 'react'

export type Tile = {
  id: number
  kind: string
  detail: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effect: any
  prev_ids: number[]
  next_ids: number[]
}

type UseTilesResult = {
  tiles: Tile[] | null
  byId: Map<number, Tile>
  loading: boolean
  error: string | null
}

/**
 * デフォルトは /public/tiles.json を取得。
 * 将来サーバー経由にするなら引数でURLを差し替えられるようにしてある。
 */
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
        const data = (await res.json()) as unknown
        if (!Array.isArray(data)) throw new Error('Invalid tiles format (not array)')
        const parsed = data as Tile[]
        if (!cancelled) setTiles(parsed)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'failed to load tiles')
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
