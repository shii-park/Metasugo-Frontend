'use client'

import { useAuth } from '@/context/AuthContext'
import { getIdToken } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'

/** タイルの種類（見た目/分類） */
export type TileKind =
  | 'profit'
  | 'loss'
  | 'quiz'
  | 'branch'
  | 'gamble'
  | 'conditional'
  | 'overall'
  | 'neighbor'
  | 'require'
  | 'goal'
  | 'setStatus'
  | 'childBonus'
  | 'normal'
  | 'conditional'
  | 'setStatus'
  | 'childBonus'

/** タイル効果の型定義（tiles.json仕様準拠） */
export type TileEffect =
  | { type: 'no_effect' }
  | { type: 'profit'; amount: number }
  | { type: 'loss'; amount: number }
  | { type: 'quiz'; quiz_id: number; amount: number }
  | { type: 'branch' }
  | { type: 'gamble' }
  | { type: 'overall'; profit_amount?: number; loss_amount?: number }
  | { type: 'neighbor'; profit_amount?: number; loss_amount?: number }
  | { type: 'require'; require_value: number; amount: number }
  | { type: 'goal' }
  | {
      type: 'conditional'
      condition: 'isMarried' | 'hasChildren' | 'isProfessor' | 'isLecturer'
      true_effect: TileEffect | null
      false_effect: TileEffect | null
    }
  | {
      type: 'setStatus'
      status: 'isMarried' | 'children' | 'job'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any
    }
  | {
      type: 'childBonus'
      profit_amount_per_child?: number
      loss_amount_per_child?: number
    }
  | Record<string, unknown>

const TILE_KINDS = [
  'normal',
  'profit',
  'loss',
  'quiz',
  'branch',
  'gamble',
  'conditional',
  'overall',
  'neighbor',
  'require',
  'goal',
  'setStatus',
  'childBonus',
  'conditional',
  'setStatus',
  'childBonus',
] as const

const isTileKind = (v: unknown): v is TileKind =>
  typeof v === 'string' && (TILE_KINDS as readonly string[]).includes(v)

export type Tile = {
  id: number
  kind: TileKind
  detail: string
  effect: TileEffect | null
  prev_ids: number[]
  next_ids: number[]
}

export type UseTilesResult = {
  tiles: Tile[] | null
  byId: Map<number, Tile>
  loading: boolean
  error: string | null
}

// デプロイ先のURLでやる
export function useTiles(src: string = 'http://localhost:8080/tiles'): UseTilesResult {
  const { user, loading: authLoading } = useAuth()
  const [tiles, setTiles] = useState<Tile[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchTiles = async () => {
      if (authLoading) return
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const token = await getIdToken(user)

        const res = await fetch(src, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to fetch tiles: HTTP ${res.status}`)

        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Invalid tiles format (not array)')

        const parsed: Tile[] = data.map((t) => ({
          id: Number(t.id),
          kind: isTileKind(t.kind) ? t.kind : 'normal',
          detail: String(t.detail ?? ''),
          effect: normalizeEffect(t.effect),
          prev_ids: Array.isArray(t.prev_ids) ? t.prev_ids : [],
          next_ids: Array.isArray(t.next_ids) ? t.next_ids : [],
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
  }, [authLoading, user, src])

  const byId = useMemo(() => {
    const m = new Map<number, Tile>()
    if (tiles) for (const t of tiles) m.set(t.id, t)
    return m
  }, [tiles])

  return { tiles, byId, loading, error }
}

/** effect 正規化関数 — tiles.json 仕様準拠 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEffect(e: any): TileEffect | null {
  if (!e) return { type: 'no_effect' }
  if (typeof e !== 'object') return { type: 'no_effect' }
  const t = e.type as string
  switch (t) {
    case 'profit':
      return { type: 'profit', amount: Number(e.amount ?? 0) }
    case 'loss':
      return { type: 'loss', amount: Number(e.amount ?? 0) }
    case 'quiz':
      return { type: 'quiz', quiz_id: Number(e.quiz_id ?? 0), amount: Number(e.amount ?? 0) }
    case 'branch':
      return { type: 'branch' }
    case 'gamble':
      return { type: 'gamble' }
    case 'overall':
      return {
        type: 'overall',
        profit_amount: numU(e.profit_amount),
        loss_amount: numU(e.loss_amount),
      }
    case 'neighbor':
      return {
        type: 'neighbor',
        profit_amount: numU(e.profit_amount),
        loss_amount: numU(e.loss_amount),
      }
    case 'require':
      return {
        type: 'require',
        require_value: Number(e.require_value ?? 0),
        amount: Number(e.amount ?? 0),
      }
    case 'goal':
      return { type: 'goal' }
    case 'conditional':
      return {
        type: 'conditional',
        condition: e.condition,
        true_effect: normalizeEffect(e.true_effect),
        false_effect: normalizeEffect(e.false_effect),
      }
    case 'setStatus':
      return {
        type: 'setStatus',
        status: e.status,
        value: e.value,
      }
    case 'childBonus':
      return {
        type: 'childBonus',
        profit_amount_per_child: numU(e.profit_amount_per_child),
        loss_amount_per_child: numU(e.loss_amount_per_child),
      }
    default:
      return { type: 'no_effect' }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const numU = (v: any) => (v == null ? undefined : Number(v))
