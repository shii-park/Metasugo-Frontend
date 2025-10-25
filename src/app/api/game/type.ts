// イベント種別（色分けやUIマッピングに使うなら 'branch' のままでOK）
export type EventType =
  | 'money_plus'
  | 'money_minus'
  | 'quiz'
  | 'branch'         // ← ここは共通のまま
  | 'global'
  | 'neighbor'
  | 'gamble'
  | 'blank'

// ---------------- Branch の型だけ 2 バリアントに分岐 ----------------

/** 仕様A: 今回の要件。「次ページの a/b に進むだけ」→ 追加ペイロード不要 */
export type BranchToPageEvent = {
  tileId: number
  type: 'branch'
  variant: 'to_page'              // ← 判別キー
  // routes など追加データなし
}

/** 仕様B: 旧来/将来用。「特定タイルへ分岐」→ routes 必須 */
export type BranchToTileEvent = {
  tileId: number
  type: 'branch'
  variant: 'to_tile'              // ← 判別キー
  routes: Array<{ toTileId: number; label: string }>
}

// -------------------------------------------------------------------

export type TileEvent =
  | { tileId: number; type: 'money_plus'; amount: number }
  | { tileId: number; type: 'money_minus'; amount: number }
  | { tileId: number; type: 'quiz'; questionId: string }
  | BranchToPageEvent
  | BranchToTileEvent
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
  totalTiles: number          // 盤面の総マス数（各ページのAPIが適切な値を返す）
  events: TileEvent[]
}
