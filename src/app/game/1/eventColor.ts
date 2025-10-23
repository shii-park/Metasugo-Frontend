// app/game/1/eventColor.ts
import type { EventType } from '@/app/api/game/events1/type'

const EVENT_COLOR: Record<EventType, string> = {
  money_plus:  'bg-blue-default',   // お金＋
  money_minus: 'bg-red-default',    // お金−
  quiz:        'bg-yellow-default', // クイズ
  branch:      'bg-gray-light',  // 分岐
  global:      'bg-purple-default',     // 全体効果（←必要ならトークンに変更）
  neighbor:    'bg-green-default',       // 隣接効果（←必要ならトークンに変更）
  gamble:      'bg-pink-default',   // ギャンブル
  blank:       'bg-gray-800',       // 何もしない
}

export const colorClassOfEvent = (t?: EventType) =>
  t ? EVENT_COLOR[t] : 'bg-gray-900'
