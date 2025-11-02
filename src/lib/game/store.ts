// src/lib/game/store.ts
import type { NeighborRequiredPayload, QuizData } from '@/lib/game/wsClient';
import { create } from 'zustand';

type QuizReq = { tileID: number; quizData: QuizData } | null
type MoneyChange = { delta: number } | null

export type NeighborReq = NeighborRequiredPayload | null

export type GameState = {
  // 分岐回数
  branchCount: number
  incrementBranch: () => void

  // ルーティング中フラグ（画面遷移演出など）
  isRouting: boolean
  setRouting: (v: boolean) => void

  // 所持金（現在値）とゴール時の最終金額
  money: number
  setMoney: (v: number) => void
  finalMoney: number | null
  setFinalMoney: (v: number) => void

  // クイズ要求
  quizReq: QuizReq
  setQuizReq: (q: QuizReq) => void
  clearQuizReq: () => void

  // 近傍効果要求
  neighborReq: NeighborReq
  setNeighborReq: (n: NonNullable<NeighborReq>) => void
  clearNeighborReq: () => void

  // 直近の増減（アニメ等に使用）
  moneyChange: MoneyChange
  setMoneyChange: (v: NonNullable<MoneyChange>) => void
  clearMoneyChange: () => void
}

export const useGameStore = create<GameState>((set) => ({
  // --- 基本 ---
  branchCount: 0,
  incrementBranch: () => set((s) => ({ branchCount: s.branchCount + 1 })),

  isRouting: false,
  setRouting: (v) => set({ isRouting: v }),

  // --- 所持金 ---
  money: 0,                       // ← 初期値。必要なら 1000000 などに変更可
  setMoney: (v) => set({ money: v }),
  finalMoney: null,
  setFinalMoney: (v) => set({ finalMoney: v }),

  // --- クイズ ---
  quizReq: null,
  setQuizReq: (q) => set({ quizReq: q }),
  clearQuizReq: () => set({ quizReq: null }),

  // --- 近傍効果 ---
  neighborReq: null,
  setNeighborReq: (n) => set({ neighborReq: n }),
  clearNeighborReq: () => set({ neighborReq: null }),

  // --- 直近の増減 ---
  moneyChange: null,
  setMoneyChange: (v) => set({ moneyChange: v }),
  clearMoneyChange: () => set({ moneyChange: null }),
}))
