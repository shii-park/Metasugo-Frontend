'use client'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'
import Image from 'next/image'
import { useState } from 'react'
import { colorClassOfEvent } from './eventColor'
import { useEvents } from './useEvents'

export default function Game1() {
  const { byId } = useEvents()
  const [isDiceOpen, setIsDiceOpen] = useState(false)

  return (
    <div className='relative w-full h-[100dvh] bg-brown-light grid place-items-center'>
      <div className='relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden'>
        <Image
          src='/back1.png'
          alt=''
          fill
          className='object-cover z-0 pointer-events-none opacity-70'
          aria-hidden
          priority
        />
        <GameHUD
          money={10000}
          remaining={50}
          className='w-full absolute top-[3%] left-[3%]'
        />
        <div className='absolute top-[3%] right-[6%]'>
          <SettingsMenu sizePct={8} className='w-1/5 z-10' />
        </div>
        <div className='absolute bottom-[10%] sm:bottom-[12%] right-[18%] rounded-md bg-brown-default/90 text-white border-2 border-white px-4 py-2 md:py-8 md:px-12 font-bold text-xl md:text-3xl'>
          スタート
        </div>
        <DiceButton
          onClick={() => setIsDiceOpen(true)}
          className='absolute right-[3%] bottom-[3%] z-10'
        />
        <DiceOverlay
          isOpen={isDiceOpen}
          onClose={() => setIsDiceOpen(false)} // 「マップに戻る」押下で閉じる
        />
        <div
          className='absolute inset-0 grid grid-cols-9 grid-rows-5 px-[10%] pt-[9.5%] pb-[7%]'
          style={{
            gridTemplateColumns:
              '9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5% 13.125% 9.5%',
            gridTemplateRows: '18% 20% 18% 26% 18%',
          }}
        >
          <Tile
            col={1}
            row={5}
            colorClass={colorClassOfEvent(byId.get(1)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={5}
            colorClass={colorClassOfEvent(byId.get(2)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={5}
            colorClass={colorClassOfEvent(byId.get(3)?.type)}
            className='w-full h-full'
          />

          <Tile
            col={1}
            row={3}
            colorClass={colorClassOfEvent(byId.get(4)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={3}
            colorClass={colorClassOfEvent(byId.get(5)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={3}
            colorClass={colorClassOfEvent(byId.get(6)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={7}
            row={3}
            colorClass={colorClassOfEvent(byId.get(7)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={9}
            row={3}
            colorClass={colorClassOfEvent(byId.get(8)?.type)}
            className='w-full h-full'
          />

          <Tile
            col={1}
            row={1}
            colorClass={colorClassOfEvent(byId.get(9)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={1}
            colorClass={colorClassOfEvent(byId.get(10)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={1}
            colorClass={colorClassOfEvent(byId.get(12)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={7}
            row={1}
            colorClass={colorClassOfEvent(byId.get(13)?.type)}
            className='w-full h-full'
          />
          <Tile
            col={9}
            row={1}
            colorClass={colorClassOfEvent(byId.get(14)?.type)}
            className='w-full h-full'
          />
        </div>
      </div>
    </div>
  )
}
