// app/api/game/events1/types.ts
export type EventType =
  | 'money_plus'      // お金＋
  | 'money_minus'     // お金−
  | 'quiz'            // クイズ
  | 'branch'          // 分岐
  | 'global'          // 全体効果
  | 'neighbor'        // 隣接効果
  | 'gamble'          // ギャンブル
  | 'blank'           // 何もなし

// タイルごとのイベント（判定用：discriminated union）
export type TileEvent =
  | { tileId: number; type: 'money_plus'; amount: number }
  | { tileId: number; type: 'money_minus'; amount: number }
  | { tileId: number; type: 'quiz'; questionId: string }
  | {
      tileId: number; type: 'branch';
      routes: Array<{ toTileId: number; label: string }>
    }
  | {
      tileId: number; type: 'global';
      effect: 'all_plus' | 'all_minus' | 'shuffle';
      amount?: number
    }
  | {
      tileId: number; type: 'neighbor';
      effect: 'left_plus' | 'right_plus' | 'left_minus' | 'right_minus';
      amount: number
    }
  | { tileId: number; type: 'gamble'; min: number; max: number }
  | { tileId: number; type: 'blank' }

export type EventsResponse = {
  totalTiles: number;        // 盤面の総マス数（いまは 51）
  events: TileEvent[];       // 各タイルのイベント
}
