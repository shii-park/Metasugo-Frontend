'use client'
import { EVENT_BY_COLOR } from '@/components/events'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import Player from '@/components/game/Player'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { colorClassOfEvent } from '../../../lib/game/eventColor'
import { useEvents } from '../../../lib/game/useEvents'

// スタートは装飾のみにした
const START_POS = { col: 7, row: 5 }

// 下段（row=5）右→左 → 中段（row=3）左→右 → 上段（row=1）右→左
const positions = [
  { col: 5, row: 5 },
  { col: 3, row: 5 },
  { col: 1, row: 5 },
  { col: 1, row: 3 },
  { col: 3, row: 3 },
  { col: 5, row: 3 },
  { col: 7, row: 3 },
  { col: 9, row: 3 },
  { col: 9, row: 1 },
  { col: 7, row: 1 },
  { col: 5, row: 1 },
  { col: 3, row: 1 },
  { col: 1, row: 1 },
]

const COLS = [9.5, 13.125, 9.5, 13.125, 9.5, 13.125, 9.5, 13.125, 9.5]
const ROWS = [18, 20, 18, 26, 18]
const PAD_X = 10 // px-[10%]
const PAD_TOP = 12 // pt-[9.5%]
const PAD_BOTTOM = 7 // pb-[7%]

export default function Game1() {
  const router = useRouter()
  const goalPushedRef = useRef(false)

  const { byId } = useEvents('/api/game/events1')

  const TOTAL_TILES = positions.length
  const [step, setStep] = useState(0)
  const cur = step === 0 ? START_POS : positions[step - 1]

  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  // 最後のタイルに着地したら2ページ目へ
  useEffect(() => {
    if (step === TOTAL_TILES && !goalPushedRef.current) {
      goalPushedRef.current = true
      router.push('/game/2/a')
    }
  }, [step, TOTAL_TILES, router])

  async function moveBy(steps: number) {
    if (isMoving || activeEventColor) return
    setIsMoving(true)

    let pos = step
    for (let i = 0; i < steps; i++) {
      if (pos >= TOTAL_TILES) break
      pos += 1
      setStep(pos)
      await new Promise((r) => setTimeout(r, 250))
      if (pos === TOTAL_TILES) break
    }

    setIsMoving(false)

    if (pos > 0 && pos <= TOTAL_TILES) {
      const t = byId.get(pos)?.type
      const color = colorClassOfEvent(t)
      if (EVENT_BY_COLOR[color]) setActiveEventColor(color)
    }
  }

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        <Image
          src="/back1.png"
          alt=""
          fill
          className="object-cover z-0 pointer-events-none opacity-70"
          aria-hidden
          priority
        />
        <GameHUD
          money={10000}
          remaining={50}
          className="w-full absolute top-[3%] left-[3%]"
        />
        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
        </div>

        <div className="absolute bottom-[10%] sm:bottom-[12%] right-[18%] rounded-md bg-brown-default/90 text-white border-2 border-white px-4 py-2 md:py-8 md:px-12 font-bold text-xl md:text-3xl">
          スタート
        </div>

        <DiceButton
          onClick={() => setIsDiceOpen(true)}
          disabled={isMoving || !!activeEventColor}
          className="absolute right-[3%] bottom-[3%] z-10"
        />
        <DiceOverlay
          isOpen={isDiceOpen}
          onClose={() => setIsDiceOpen(false)}
          getDiceValue={async () => {
            const res = await fetch('/api/dice', { cache: 'no-store' })
            if (!res.ok) throw new Error('サイコロAPIエラー')
            const { value } = (await res.json()) as { value: number }
            return Math.max(1, Math.min(6, Math.floor(value))) as 1 | 2 | 3 | 4 | 5 | 6
          }}
          onConfirm={(value) => moveBy(value)}
        />

        <div
          className="absolute inset-0 grid grid-cols-9 grid-rows-5 px-[10%] pt-[9.5%] pb-[7%]"
          style={{
            gridTemplateColumns:
              '9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5%',
            gridTemplateRows: '18% 20% 18% 26% 18%',
          }}
        >
          <Tile col={5} row={5} colorClass={colorClassOfEvent(byId.get(1)?.type)} className="w-full h-full" />
          <Tile col={3} row={5} colorClass={colorClassOfEvent(byId.get(2)?.type)} className="w-full h-full" />
          <Tile col={1} row={5} colorClass={colorClassOfEvent(byId.get(3)?.type)} className="w-full h-full" />

          <Tile col={1} row={3} colorClass={colorClassOfEvent(byId.get(4)?.type)} className="w-full h-full" />
          <Tile col={3} row={3} colorClass={colorClassOfEvent(byId.get(5)?.type)} className="w-full h-full" />
          <Tile col={5} row={3} colorClass={colorClassOfEvent(byId.get(6)?.type)} className="w-full h-full" />
          <Tile col={7} row={3} colorClass={colorClassOfEvent(byId.get(7)?.type)} className="w-full h-full" />
          <Tile col={9} row={3} colorClass={colorClassOfEvent(byId.get(8)?.type)} className="w-full h-full" />

          <Tile col={9} row={1} colorClass={colorClassOfEvent(byId.get(9)?.type)} className="w-full h-full" />
          <Tile col={7} row={1} colorClass={colorClassOfEvent(byId.get(10)?.type)} className="w-full h-full" />
          <Tile col={5} row={1} colorClass={colorClassOfEvent(byId.get(11)?.type)} className="w-full h-full" />
          <Tile col={3} row={1} colorClass={colorClassOfEvent(byId.get(12)?.type)} className="w-full h-full" />
          <Tile col={1} row={1} colorClass={colorClassOfEvent(byId.get(13)?.type)} className="w-full h-full" />
        </div>

        <Player
          col={cur.col}
          row={cur.row}
          colsPct={COLS}
          rowsPct={ROWS}
          padXPct={PAD_X}
          padTopPct={PAD_TOP}
          padBottomPct={PAD_BOTTOM}
          label="あなた"
          imgSrc="/player1.png"
        />

        {EventComp && <EventComp onClose={() => setActiveEventColor(null)} />}
      </div>
    </div>
  )
}
