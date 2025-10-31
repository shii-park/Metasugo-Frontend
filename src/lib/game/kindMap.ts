// src/lib/game/kindMap.ts (a.k.a. kindToEventType.ts)
import type { EventType } from '@/app/api/game/type'
import type { TileKind } from './useTiles'

export function kindToEventType(kind?: TileKind): EventType {
  switch (kind) {
    case 'normal':      return 'normal'
    case 'profit':      return 'profit'
    case 'loss':        return 'loss'
    case 'quiz':        return 'quiz'
    case 'branch':      return 'branch'
    case 'gamble':      return 'gamble'
    case 'overall':     return 'overall'
    case 'neighbor':    return 'neighbor'
    case 'require':     return 'neighbor'   // 近似色に寄せる（必要なら別色に）
    case 'goal':        return 'goal'

    // 追加系（仕様書より）
    case 'conditional': return 'overall'
    case 'setStatus':   return 'overall'
    case 'childBonus':  return 'overall'

    // 未定義/不正値 → フォールバック
    default:            return 'normal'
  }
}
