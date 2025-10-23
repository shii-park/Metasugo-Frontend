import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

let idx = 0
const sequence = [1, 2, 3, 4, 5, 6] as const

export async function GET() {
  await new Promise((r) => setTimeout(r, 500))

  const value = sequence[idx % sequence.length]
  idx += 1

  // 本番側の形に合わせて { value: number } を返す
  return NextResponse.json({ value })
}
