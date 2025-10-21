// lib/sugoroku/selectors.ts
// ==========================================================
// 目的：UI用の“派生データ”を計算する純関数群（副作用なし）。
// 例：
// - getNextOptions(currentTileId, edges): 分岐候補の算出
// - getPolyline(tiles, edges): Path描画用の線データ
// - getNeighborPlayers(currentTileId, players): 隣接プレイヤーの抽出
// - countToGoal(map): ゴールまでの残りマス数の計算
// ここはUIの見た目を助けるための補助レイヤー。エンジンからも呼べる。
// メモ化しやすい構造で。テストも容易。
// ==========================================================
