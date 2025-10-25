// app/game/layout.tsx
import RouteLoadingOverlay from '@/components/common/RouteLoadingOverlay'

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RouteLoadingOverlay message="ロード中…" />
    </>
  )
}
