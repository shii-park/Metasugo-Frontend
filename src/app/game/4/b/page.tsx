'use client'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'
import Image from 'next/image'
import { useState } from 'react'

export default function Game4a() {
  const [isDiceOpen, setIsDiceOpen] = useState(false)

  return (
    <div className='relative w-full h-[100dvh] bg-brown-light grid place-items-center'>
      <div className='relative aspect-[16/9] w-[min(100vw,calc(100dvh*16/9))] overflow-hidden'>
        <Image
          src='/back4.png'
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
        <div className='absolute top-[10%] sm:top-[12%] right-[13%] rounded-md bg-brown-default/90 text-white border-2 border-white w-[20%] h-[20%] font-bold text-xl md:text-3xl flex items-center justify-center'>
          ゴール
        </div>
        <DiceButton
          onClick={() => setIsDiceOpen(true)}
          className='absolute right-[3%] bottom-[3%] z-10'
        />
        <DiceOverlay
          isOpen={isDiceOpen}
          onClose={() => setIsDiceOpen(false)}
        />
        <div
          className='absolute inset-0 grid grid-cols-7 grid-rows-5 px-[8%] pt-[9%] pb-[7%]'
          style={{
            gridTemplateColumns: '8.5% 15% 8.5% 15% 8.5% 15% 8.5% 15% 8.5%',
            gridTemplateRows: '17% 21% 17% 24% 17%',
          }}
        >
          <Tile col={1} row={5} colorClass='bg-red-default' />
          <Tile col={3} row={5} colorClass='bg-blue-default' />
          <Tile col={5} row={5} colorClass='bg-green-default' />
          <Tile col={7} row={5} colorClass='bg-red-default' />

          <Tile col={1} row={3} colorClass='bg-blue-default' />
          <Tile col={3} row={3} colorClass='bg-red-default' />
          <Tile col={5} row={3} colorClass='bg-red-default' />
          <Tile col={7} row={3} colorClass='bg-blue-default' />

          <Tile col={1} row={1} colorClass='bg-yellow-300' />
          <Tile col={3} row={1} colorClass='bg-blue-default' />
          <Tile col={5} row={1} colorClass='bg-red-default' />

        </div>
      </div>
    </div>
  )
}
