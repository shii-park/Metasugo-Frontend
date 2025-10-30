'use client'
import type { EventsResponse, TileEvent } from '@/app/api/game/type'
import { useEffect, useMemo, useState } from 'react'

/**
 * 任意のイベントAPIエンドポイントからイベントデータを取得するフック
 * （認証トークン付き）
 *
 * @example
 * const { byId, loading } = useEvents('/api/game/events2a', userToken)
 */
export function useEvents(endpoint: string, token?: string) {
  const [data, setData] = useState<EventsResponse | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // token が未定義なら fetch 待機
    if (!token) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}, status ${res.status}`)
        const json = await res.json()

        // 新JSONは配列だけで返ってくる場合をラップ
        const wrapped: EventsResponse = Array.isArray(json)
          ? { totalTiles: json.length, events: json }
          : json

        if (!cancelled) {
          setData(wrapped)
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [endpoint, token])

  // data が揃うまで Map は作らない
  const byId = useMemo(() => {
    if (!data?.events) return new Map<number, TileEvent>()
    const map = new Map<number, TileEvent>(data.events.map(e => [e.id, e] as const))
    console.log('[useEvents] byId Map 作成:', map)
    return map
  }, [data])

  return { data, byId, loading, error }
}