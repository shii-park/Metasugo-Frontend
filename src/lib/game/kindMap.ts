import type { EventType } from '@/app/api/game/type';
import type { TileKind } from './useTiles';

export function kindToEventType(kind?: TileKind): EventType | undefined {
  switch (kind) {
    // case 'profit':     return 'money_plus';
    // case 'loss':       return 'money_minus';
    case 'quiz':       return 'quiz';
    case 'branch':     return 'branch';
    // case 'overall':    return 'overall';
    case 'neighbor':   return 'neighbor';
    // case 'require':    return 'require';
    case 'gamble':     return 'gamble';
    case 'goal':       // 既存ロジックに合わせてゴールは分岐色で表示
      return 'branch';
    default:
      return undefined;
  }
}
