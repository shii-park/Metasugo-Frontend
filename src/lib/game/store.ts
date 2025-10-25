import { create } from 'zustand'

export type GameState = {
  branchCount: number
  incrementBranch: () => void
  isRouting: boolean
  setRouting: (v: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  branchCount: 0,
  incrementBranch: () => set((s) => ({ branchCount: s.branchCount + 1 })),

  isRouting: false,
  setRouting: (v) => set({ isRouting: v }),
}))
