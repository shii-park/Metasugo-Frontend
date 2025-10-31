// イベント種別（色分けやUIマッピングに使うなら 'branch' のままでOK）
export type EventType =
  | 'profit'
  | 'loss'
  | 'quiz'
  | 'branch'         // ← ここは共通のまま
  | 'overall'
  | 'neighbor'
  | 'gamble'
  | 'normal'
  | 'goal'

// ---------------- Branch の型だけ 2 バリアントに分岐 ----------------

/** 仕様A: 今回の要件。「次ページの a/b に進むだけ」→ 追加ペイロード不要 */
export type BranchToPageEvent = {
  id: number               // tileId 相当
  kind: 'branch'           // 分岐マスの種類
  detail: string           // 説明文
  effect: {
    type: 'branch'         // 判別用
  }
  prev_ids: number[]       // 前のマスID
  next_ids: number[]       // 次のマスID
}

/** 仕様B: 旧来/将来用。「特定タイルへ分岐」→ routes 必須 */
// export type BranchToTileEvent = {
//   tileId: number
//   type: 'branch'
//   variant: 'to_tile'              // ← 判別キー
//   routes: Array<{ toTileId: number; label: string }>
// }

// -------------------------------------------------------------------

export type TileEvent =
  | {
      id: number           // tileId 相当
      kind: 'profit'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'profit'
        amount: number     // 利益額
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | {
      id: number           // tileId 相当
      kind: 'loss'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'loss'
        amount: number     // 損失額
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | {
      id: number           // tileId 相当
      kind: 'quiz'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'quiz'
        quiz_id: number
        amount: number     // 賞金額
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | BranchToPageEvent
  // | BranchToTileEvent
  | {
      id: number           // tileId 相当
      kind: 'overall'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'overall'
        amount?: number     // 徴収、配付額
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | {
      id: number           // tileId 相当
      kind: 'neighbor'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'neighbor'
        amount?: number     // 徴収、配付額
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | {
      id: number           // tileId 相当
      kind: 'gamble'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'gamble'
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | {
      id: number           // tileId 相当
      kind: 'normal'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'no_effect'
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }
  | {
      id: number           // tileId 相当
      kind: 'goal'       // マスの種類
      detail: string       // 説明文
      effect: {
        type: 'goal'
      }
      prev_ids: number[]   // 前のマスID
      next_ids: number[]   // 次のマスID
    }

export type EventsResponse = {
  totalTiles: number          // 盤面の総マス数（各ページのAPIが適切な値を返す）
  events: TileEvent[]
}
