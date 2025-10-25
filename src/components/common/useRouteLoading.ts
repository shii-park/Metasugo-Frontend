'use client'

import { useGameStore } from '@/lib/game/store'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// 画面が切り替わった「後」に isRouting を false に戻す
export function useRouteLoadingReset(): void {
  const pathname = usePathname()
  const setRouting = useGameStore((s) => s.setRouting)

  useEffect(() => {
    // ページが切り替わってここが実行されるタイミングでOFF
    setRouting(false)
  }, [pathname, setRouting])
}
