'use client'

import type { EventType } from '@/app/api/game/type'
import { EVENT_BY_COLOR } from '@/components/events'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import Player from '@/components/game/Player'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'
import { colorClassOfEvent } from '@/lib/game/eventColor'
import { useEvents } from '@/lib/game/useEvents'
import Image from 'next/image'
import { useState } from 'react'

// ★ スタート（装飾扱い）：左下の外側っぽい位置に置くなら col:1,row:5 でOK
const START_POS = { col: 1, row: 5 }

// 2-a の進行：下段(1→4, L→R) → 中段(5→8, R→L) → 上段(9→12, L→R)
const positions = [
  { col: 1, row: 5 }, { col: 3, row: 5 }, { col: 5, row: 5 }, { col: 7, row: 5 },
  { col: 7, row: 3 }, { col: 5, row: 3 }, { col: 3, row: 3 }, { col: 1, row: 3 },
  { col: 1, row: 1 }, { col: 3, row: 1 }, { col: 5, row: 1 }, { col: 7, row: 1 },
]

const COLS = [7, 17.8, 7, 17.8, 7, 17.8, 7]; // %
const ROWS = [10, 24.2, 10, 24.2, 10];        // %
const PAD_X = 7.2;   // %
const PAD_TOP = 10.5;
const PAD_BOTTOM = 14.0;


export default function Game2a() {
  const { byId } = useEvents('/api/game/event2a')
  const TOTAL_TILES = positions.length

  const [step, setStep] = useState(1)
  const cur = step === 0 ? START_POS : positions[step - 1]

  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)

  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  async function moveBy(steps: number) {
    if (isMoving || activeEventColor) return
    if (step >= TOTAL_TILES) return

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

    // 着地後にイベント発火
    if (pos > 0 && pos <= TOTAL_TILES) {
      const isGoal = pos === TOTAL_TILES
      const GOAL_EVENT_TYPE: EventType = 'branch'
      const tileEventType: EventType | undefined =
        isGoal ? GOAL_EVENT_TYPE : byId.get(pos)?.type

      const color = colorClassOfEvent(tileEventType)
      if (color && EVENT_BY_COLOR[color]) setActiveEventColor(color)
    }
  }

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        <Image
          src="/back2.png"
          alt=""
          fill
          className="object-cover z-0 pointer-events-none opacity-70"
          aria-hidden
          priority
        />

        <GameHUD money={10000} remaining={50} className="w-full absolute top-[3%] left-[3%]" />
        <div className="absolute top-[3%] right-[6%]">
          <SettingsMenu sizePct={8} className="w-1/5 z-10" />
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

        {/* タイル配置 */}
        <div
          className="absolute inset-0 grid grid-cols-7 grid-rows-5 px-[8%] pt-[8.5%] pb-[8%]"
          style={{
            gridTemplateColumns: '8.5% 18% 8.5% 18% 8.5% 18% 8.5%',
            gridTemplateRows: '17% 23.5% 17% 24% 17%',
          }}
        >
          {/* 下段 1..4 */}
          <Tile col={1} row={5} colorClass={colorClassOfEvent(byId.get(1)?.type)} className="w-full h-full" />
          <Tile col={3} row={5} colorClass={colorClassOfEvent(byId.get(2)?.type)} className="w-full h-full" />
          <Tile col={5} row={5} colorClass={colorClassOfEvent(byId.get(3)?.type)} className="w-full h-full" />
          <Tile col={7} row={5} colorClass={colorClassOfEvent(byId.get(4)?.type)} className="w-full h-full" />
          {/* 中段 5..8（R→L） */}
          <Tile col={7} row={3} colorClass={colorClassOfEvent(byId.get(5)?.type)} className="w-full h-full" />
          <Tile col={5} row={3} colorClass={colorClassOfEvent(byId.get(6)?.type)} className="w-full h-full" />
          <Tile col={3} row={3} colorClass={colorClassOfEvent(byId.get(7)?.type)} className="w-full h-full" />
          <Tile col={1} row={3} colorClass={colorClassOfEvent(byId.get(8)?.type)} className="w-full h-full" />
          {/* 上段 9..12 */}
          <Tile col={1} row={1} colorClass={colorClassOfEvent(byId.get(9)?.type)} className="w-full h-full" />
          <Tile col={3} row={1} colorClass={colorClassOfEvent(byId.get(10)?.type)} className="w-full h-full" />
          <Tile col={5} row={1} colorClass={colorClassOfEvent(byId.get(11)?.type)} className="w-full h-full" />
          <Tile col={7} row={1} colorClass={colorClassOfEvent(byId.get(12)?.type)} className="w-full h-full" />
        </div>

        {/* プレイヤー */}
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

        {/* イベント */}
        {EventComp && (
          <EventComp
            // ※ Branch は自分で /game/3/{a|b} へ push する実装（親は push しない）
            onClose={() => setActiveEventColor(null)}
          />
        )}
      </div>
    </div>
  )
}
