import { create } from 'zustand'

/**
 * 条件分岐マスを踏んだ回数（1ページに1つの分岐マスがある前提）
 * choice: A/B の選択結果によるページ遷移に利用
 */
export type GameState = {
  branchCount: number
  incrementBranch: () => void
}

/**
 * Zustand ストア（型推論と型安全を維持）
 */
export const useGameStore = create<GameState>((set) => ({
  branchCount: 0,
  incrementBranch: () =>
    set((prev) => ({
      branchCount: prev.branchCount + 1,
    })),
}))
