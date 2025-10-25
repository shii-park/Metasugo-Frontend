'use client'

import { useGameStore } from '@/lib/game/store'
import { useRouteLoadingReset } from './useRouteLoading'

type RouteLoadingOverlayProps = {
  message?: string
}

export default function RouteLoadingOverlay({
  message = '読み込み中…',
}: RouteLoadingOverlayProps) {
  // ルート更新のたびに isRouting を落とす
  useRouteLoadingReset()

  const isRouting = useGameStore((s) => s.isRouting)

  if (!isRouting) return null

  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 backdrop-blur-sm"
      aria-live="polite"
      role="status"
    >
      <div className="rounded-xl bg-white/95 shadow-lg px-6 py-4 text-center">
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <p className="font-semibold">{message}</p>
        <p className="text-xs text-gray-500 mt-1">ページを読み込んでいます</p>
      </div>
    </div>
  )
}
