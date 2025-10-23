'use client'
import type { EventsResponse, TileEvent } from '@/app/api/game/type'
import { useEffect, useMemo, useState } from 'react'

/**
 * 任意のイベントAPIエンドポイントからイベントデータを取得するフック
 * @example
 * const { byId, loading } = useEvents('/api/game/events2a')
 */
export function useEvents(endpoint: string) {
  const [data, setData] = useState<EventsResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${endpoint}`)
        return res.json()
      })
      .then((json: EventsResponse) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData({ totalTiles: 0, events: [] })
      })
    return () => {
      cancelled = true
    }
  }, [endpoint])

  const byId = useMemo(
    () => new Map<number, TileEvent>(data?.events.map(e => [e.tileId, e]) ?? []),
    [data]
  )

  return { byId, loading: !data }
}
