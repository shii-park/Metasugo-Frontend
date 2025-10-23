import { NextResponse } from 'next/server'
import type { EventsResponse } from './type'

// 本来はバックエンドからやってくるデータ。今回は仮で作成中
export async function GET() {
  const events: EventsResponse['events'] = [
    { tileId: 1,  type: 'money_plus',  amount: 1000 },
    { tileId: 2, type: 'money_minus', amount: 500 },
    { tileId: 3,  type: 'money_plus',  amount: 1000 },
    { tileId: 4,  type: 'quiz',        questionId: 'Q001' },
    { tileId: 5,  type: 'money_plus',  amount: 1000 },
    { tileId: 6,  type: 'neighbor', effect: 'left_plus', amount: 300 },
    { tileId: 7,  type: 'gamble',   min: -2000, max: 2000 },
    { tileId: 8,  type: 'money_plus',  amount: 1000 },
    { tileId: 9,  type: 'money_minus', amount: 500  },
    { tileId: 10, type: 'quiz',        questionId: 'Q002' },
    { tileId: 11, type: 'branch', routes: [
      { toTileId: 12, label: '近道' },
      { toTileId: 13, label: '遠回り' },
    ]},
    { tileId: 12, type: 'global',   effect: 'all_minus', amount: 500 },
    { tileId: 13, type: 'neighbor', effect: 'right_minus', amount: 300 },
    { tileId: 14, type: 'gamble',   min: -2000, max: 2000 },
  ]

  const body: EventsResponse = { totalTiles: events.length, events }
  return NextResponse.json(body, { status: 200 })
}
