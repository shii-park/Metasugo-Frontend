// app/game/1/eventColor.ts
import type { EventType } from '@/app/api/game/type'

const EVENT_COLOR: Record<EventType, string> = {
  profit:  'bg-blue-default',   // お金＋
  loss: 'bg-red-default',    // お金−
  quiz:        'bg-yellow-default', // クイズ
  branch:      'bg-gray-light',  // 分岐
  overall:      'bg-pink-default',     // 全体効果
  neighbor:    'bg-green-default',       // 隣接効果
  gamble:      'bg-purple-default',   // ギャンブル
  normal:       'bg-gray-800',       // 何もしない
  goal:  'bg-brown-default/90'
}

export const colorClassOfEvent = (t?: EventType) =>
  t ? EVENT_COLOR[t] : 'bg-gray-900'
