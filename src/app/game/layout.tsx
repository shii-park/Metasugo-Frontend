// すごろく画面全体の共通レイアウト。
// 各マップページ (/game/1, /game/2...) の共通UIをまとめる。
// 例: 所持金表示、残りマス表示、マップ切り替えナビ、共通BGMなど。
// ZustandのgameStoreを読み取り、全マップで状態を共有する。


export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
