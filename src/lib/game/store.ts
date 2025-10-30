// src/lib/game/store.ts
import type { QuizData } from "@/lib/game/wsClient";
import { create } from 'zustand';

type QuizReq = { tileID: number; quizData: QuizData } | null;

export type GameState = {
  branchCount: number
  incrementBranch: () => void
  isRouting: boolean
  setRouting: (v: boolean) => void

  // ★ 追加: サーバから要求されたクイズ
  quizReq: QuizReq
  setQuizReq: (q: QuizReq) => void
  clearQuizReq: () => void
}

export const useGameStore = create<GameState>((set) => ({
  branchCount: 0,
  incrementBranch: () => set((s) => ({ branchCount: s.branchCount + 1 })),

  isRouting: false,
  setRouting: (v) => set({ isRouting: v }),

  // ★ 追加
  quizReq: null,
  setQuizReq: (q) => set({ quizReq: q }),
  clearQuizReq: () => set({ quizReq: null }),
}))
