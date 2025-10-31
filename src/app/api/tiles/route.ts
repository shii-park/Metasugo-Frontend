// app/api/tiles/route.ts
import { NextRequest, NextResponse } from 'next/server'

const ORIGIN = process.env.BACKEND_API_ORIGIN // 例: http://localhost:8080
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  if (!ORIGIN) {
    return NextResponse.json(
      { error: 'BACKEND_API_ORIGIN is not set' },
      { status: 500 },
    )
  }

  // フロントから届いた Bearer をそのまま中継
  const auth = req.headers.get('authorization') ?? ''
  const url = `${ORIGIN}/tiles` // バックエンドは /tiles でOK（あなたのGoコードどおり）

  try {
    const res = await fetch(url, {
      headers: { Authorization: auth },
      cache: 'no-store',
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch (e) {
    console.error('[route:/api/tiles] proxy error:', e)
    return NextResponse.json({ error: 'proxy failed' }, { status: 502 })
  }
}
