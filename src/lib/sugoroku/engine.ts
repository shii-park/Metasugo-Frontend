// lib/sugoroku/engine.ts
// ==========================================================
// 目的：ゲームの「中枢ロジック」。UIはここを呼ぶだけ。
// 提供する主な関数（表面APIは将来サーバー化しても維持する）:
// - initMap(mapId): 開始位置・残りマスなどを初期化（Zustand更新）
// - roll(): サイコロ値を決める（クライアント版はMath.random、サーバー版はServer Action）
// - move(steps): 現在位置からsteps分、Edgeを辿って最終マスへ
// - enter(tileId): 到達マスのeffectsを解決（money/quiz/random/none, scope=self/all/neighbors）
// - choose(nextTileId): 分岐マスでプレイヤーが選んだ進行先を確定
// - applyQr(payload): QR経由イベントの適用（署名検証はサーバー側で）
// 責務：状態更新（Zustand）、ログ生成（監査/リプレイ）、分岐/隣接判定の呼び出し。
// 注意：UIの見た目・座標処理は持たない。純粋にルールの適用に専念。
// 将来：Server Actionsに同名関数を用意→チート対策/マルチ対応へ移行可能（権威移譲）。
// ==========================================================
