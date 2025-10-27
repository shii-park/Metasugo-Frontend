'use client'
import type { EventType } from '@/app/api/game/type';
import { EVENT_BY_COLOR } from '@/components/events';
import Finish from '@/components/events/Finish';
import DiceButton from '@/components/game/DiceButton';
import DiceOverlay from '@/components/game/DiceOverlay';
import GameHUD from '@/components/game/GameHUD';
import Player from '@/components/game/Player';
import SettingsMenu from '@/components/game/SettingMenu';
import Tile from '@/components/game/Tile';
import { colorClassOfEvent } from '@/lib/game/eventColor';
import { useEvents } from '@/lib/game/useEvents';
import Image from 'next/image';
import { useState } from 'react';

const START_POS = { col: 1, row: 5 }
const positions = [
  { col: 1, row: 5 },
  { col: 3, row: 5 },
  { col: 5, row: 5 },
  { col: 7, row: 5 },
  { col: 7, row: 3 },
  { col: 5, row: 3 },
  { col: 3, row: 3 },
  { col: 1, row: 3 },
  { col: 1, row: 1 },
  { col: 3, row: 1 },
  { col: 5, row: 1 },
  { col: 7, row: 1 },
]
const GOAL_STEP = positions.length
const LAST_TILE = GOAL_STEP - 1

const COLS = [1.75, 12, 5.5, 10.125, 5.5, 5, 15.75]; // %
const ROWS = [12, 11, 18, 8, 18];        // %
const PAD_X = 7.2;   // %
const PAD_TOP = 16;
const PAD_BOTTOM = 7;

export default function Game4a() {
  const { byId } = useEvents('/api/game/event4a')

  const [step, setStep] = useState(1)
  const cur = step === 0 ? START_POS : positions[step - 1]

  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [activeEventColor, setActiveEventColor] = useState<string | null>(null)
  const [showFinish, setShowFinish] = useState(false)

  const EventComp = activeEventColor ? EVENT_BY_COLOR[activeEventColor] : null

  async function moveBy(steps: number) {
    if (isMoving || activeEventColor || showFinish) return
    if (step >= GOAL_STEP) return

    setIsMoving(true)
    let pos = step
    for (let i = 0; i < steps; i++) {
      if (pos >= GOAL_STEP) break
      pos += 1
      setStep(pos)
      await new Promise((r) => setTimeout(r, 250))
      if (pos === GOAL_STEP) break
    }
    setIsMoving(false)

    if (pos === GOAL_STEP) {
      setShowFinish(true)
      return
    }

    if (pos > 0 && pos <= LAST_TILE) {
      const tileEventType: EventType | undefined = byId.get(pos)?.type
      const color = colorClassOfEvent(tileEventType)
      if (color && EVENT_BY_COLOR[color]) setActiveEventColor(color)
    }
  }

  return (
    <div className="relative w-full h-[100dvh] bg-brown-light grid place-items-center">
      <div className="relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden">
        <Image
          src="/back4.png"
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

        <div className="absolute top-[10%] sm:top-[12%] right-[13%] rounded-md bg-brown-default/90 text-white border-2 border-white w-[20%] h-[20%] font-bold text-xl md:text-3xl flex items-center justify-center">
          ゴール
        </div>

        <DiceButton
          onClick={() => setIsDiceOpen(true)}
          disabled={isMoving || !!activeEventColor || showFinish}
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
          className="absolute inset-0 grid grid-cols-7 grid-rows-5 px-[8%] pt-[8.5%] pb-[8%]"
          style={{
            gridTemplateColumns: '8.5% 18% 8.5% 18% 8.5% 18% 8.5%',
            gridTemplateRows: '17% 23.5% 17% 24% 17%',
          }}
        >
          <Tile col={1} row={5} colorClass={colorClassOfEvent(byId.get(1)?.type)} />
          <Tile col={3} row={5} colorClass={colorClassOfEvent(byId.get(2)?.type)} />
          <Tile col={5} row={5} colorClass={colorClassOfEvent(byId.get(3)?.type)} />
          <Tile col={7} row={5} colorClass={colorClassOfEvent(byId.get(4)?.type)} />

          <Tile col={7} row={3} colorClass={colorClassOfEvent(byId.get(5)?.type)} />
          <Tile col={5} row={3} colorClass={colorClassOfEvent(byId.get(6)?.type)} />
          <Tile col={3} row={3} colorClass={colorClassOfEvent(byId.get(7)?.type)} />
          <Tile col={1} row={3} colorClass={colorClassOfEvent(byId.get(8)?.type)} />

          <Tile col={1} row={1} colorClass={colorClassOfEvent(byId.get(9)?.type)} />
          <Tile col={3} row={1} colorClass={colorClassOfEvent(byId.get(10)?.type)} />
          <Tile col={5} row={1} colorClass={colorClassOfEvent(byId.get(11)?.type)} />
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

        {showFinish && (
          <Finish
            title="ゴール！"
            message="おつかれさま！ここでゲーム終了です。"
            onClose={() => setShowFinish(false)}
          />
        )}
      </div>
    </div>
  )
}
