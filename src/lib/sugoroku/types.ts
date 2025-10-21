// lib/sugoroku/types.ts
// ==========================================================
// 目的：フロント/バックで共有する“データ契約（型の約束）”を定義する。
// ここに置く型は、エンジン、UI、サーバー（Server Actions/API）で共通に使う。
// - マス（Tile）/ 道（Edge）/ マップ（Map）
// - 効果（Effect：money/quiz/random/none + scope）
// - プレイヤー/ゲーム状態（PlayerState/GameState）
// - コマンド & レスポンス（Roll/Move/Enter/Choose/QuizAnswer）
// ポイント：ここを変更すると全層に影響するため、最初に固める。
// ==========================================================
