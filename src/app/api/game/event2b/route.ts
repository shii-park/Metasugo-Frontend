import { NextResponse } from 'next/server'
import type { EventsResponse } from '../type'
// 本来はバックエンドからやってくるデータを記入.今回は仮で作成中
export async function GET() {
    const events: EventsResponse['events'] = [
        { tileId: 1,  type: 'money_plus', amount: 500 },
        { tileId: 2,  type: 'money_minus',  amount: 1000 },
        { tileId: 3,  type: 'neighbor', effect: 'right_plus', amount: 300 },
        { tileId: 4,  type: 'money_minus', amount: 500 },
        { tileId: 5,  type: 'money_minus',  amount: 1000 },
        { tileId: 6,  type: 'money_plus', amount: 500 },
        { tileId: 7,  type: 'money_minus', amount: 500 },
        { tileId: 8,  type: 'money_plus',  amount: 1000 },
        { tileId: 9,  type: 'gamble',   min: -2000, max: 2000 },
        { tileId: 10, type: 'money_plus',  amount: 1000 },
        { tileId: 11, type: 'money_minus', amount: 500 },
        { tileId: 12, type: 'branch', variant: 'to_page' },
    ]

    const body: EventsResponse = { totalTiles: events.length, events }
    return NextResponse.json(body, { status: 200 })
}
