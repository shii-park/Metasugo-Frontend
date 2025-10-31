/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from 'react'
import Branch from './Branch'
import Gamble from './Gamble'
import Global from './Global'
import MoneyMinus from './MoneyMinus'
import MoneyPlus from './MoneyPlus'
import Neighbor from './Neighbor'
import Quiz from './Quiz'

// あなたの EVENT_COLOR に合わせて色クラスでマッピング
// export const EVENT_BY_COLOR: Record<string, ComponentType<{ onClose: () => void }>> = {
export const EVENT_BY_COLOR: Record<string, ComponentType<any>> = { // ← any に変更
  'bg-blue-default':    MoneyPlus,   // money_plus
  'bg-red-default':     MoneyMinus,  // money_minus
  'bg-yellow-default':  Quiz,        // quiz
  'bg-gray-light':      Branch,      // branch
  'bg-pink-default':  Global,      // global
  'bg-green-default':   Neighbor,    // neighbor
  'bg-purple-default':    Gamble,      // gamble
}
