'use client'
import type { EventsResponse, TileEvent } from '@/app/api/game/events1/type'
import { useEffect, useMemo, useState } from 'react'

export function useEvents() {
  const [data, setData] = useState<EventsResponse | null>(null)

  useEffect(() => {
    fetch('/api/game/events1')
      .then(r => r.json())
      .then((json: EventsResponse) => setData(json))
      .catch(() => setData({ totalTiles: 0, events: [] }))
  }, [])

  const byId = useMemo(
    () => new Map<number, TileEvent>(data?.events.map(e => [e.tileId, e]) ?? []),
    [data]
  )

  return { byId, loading: !data }
}
