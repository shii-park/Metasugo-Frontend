// lib/sugoroku/registry.ts
// ==========================================================
// 目的：クイズやイベントなど“外部リソースの登録表”をまとめる。
// - quizId → { question, choices[], answerIndex, timeLimitSec, reward 等 }
// - eventId → { name, effects[] } など
// マスのeffectsが { kind:"quiz", quizId:"..." } を持つとき、
// UI/エンジンはここから実体を引いて使う。
// 将来：サーバー配信/NotionやCMSからの同期に置き換える余地あり。
// ==========================================================
