// src/lib/game/store.ts
import type { QuizData } from '@/lib/game/wsClient';
import { create } from 'zustand';

type QuizReq = { tileID: number; quizData: QuizData } | null
type MoneyChange = { delta: number } | null

export type BranchReq = {tileID: number; options: number[]} | null;

export type GameState = {
  branchCount: number
  incrementBranch: () => void
  isRouting: boolean
  setRouting: (v: boolean) => void

  quizReq: QuizReq
  setQuizReq: (q: QuizReq) => void         // ←そのままでもOK（nullはclearで消す運用）
  clearQuizReq: () => void

  branchReq: BranchReq
  setBranchReq: (b: NonNullable<BranchReq>) => void
  clearBranchReq: () => void

  moneyChange: MoneyChange
  setMoneyChange: (v: NonNullable<MoneyChange>) => void
  clearMoneyChange: () => void


}

export const useGameStore = create<GameState>((set) => ({
  branchCount: 0,
  incrementBranch: () => set((s) => ({ branchCount: s.branchCount + 1 })),

  isRouting: false,
  setRouting: (v) => set({ isRouting: v }),

  quizReq: null,
  setQuizReq: (q) => set({ quizReq: q }),
  clearQuizReq: () => set({ quizReq: null }),

  branchReq: null,
  setBranchReq: (b) => set({ branchReq: b}),
  clearBranchReq: () => set({ branchReq: null}),

  // ★ ここを追加
  moneyChange: null,
  setMoneyChange: (v) => set({ moneyChange: v }),
  clearMoneyChange: () => set({ moneyChange: null }),
}))
