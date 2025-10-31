/** タイルの種類（= kind） */
export type TileKind =
  | 'profit' | 'loss' | 'quiz' | 'branch' | 'gamble'
  | 'conditional' | 'overall' | 'neighbor' | 'require'
  | 'goal' | 'setStatus' | 'childBonus' | 'normal'

/** effect: tiles.json 仕様に準拠 */
export type TileEffect =
  | { type: 'no_effect' }
  | { type: 'profit'; amount: number }
  | { type: 'loss'; amount: number }
  | { type: 'quiz'; quiz_id: number; amount: number }
  | { type: 'branch' }
  | { type: 'gamble' }
  | { type: 'overall'; profit_amount?: number; loss_amount?: number }
  | { type: 'neighbor'; profit_amount?: number; loss_amount?: number }
  | { type: 'require'; require_value: number; amount: number }
  | { type: 'goal' }
  | {
      type: 'conditional'
      condition: 'isMarried' | 'hasChildren' | 'isProfessor' | 'isLecturer'
      true_effect: TileEffect | null
      false_effect: TileEffect | null
    }
  | {
      type: 'setStatus'
      status: 'isMarried' | 'children' | 'job'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any
    }
  | {
      type: 'childBonus'
      profit_amount_per_child?: number
      loss_amount_per_child?: number
    }
  | Record<string, unknown> // 将来拡張

export type Tile = {
  id: number
  kind: TileKind
  detail: string
  effect: TileEffect | null // 仕様では null も許可
  prev_ids: number[]
  next_ids: number[]
}
