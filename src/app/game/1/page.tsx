'use client'
import DiceButton from '@/components/game/DiceButton'
import DiceOverlay from '@/components/game/DiceOverlay'
import GameHUD from '@/components/game/GameHUD'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'
import Image from 'next/image'
import { useState } from 'react'

export default function Game1() {
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
        <div className='absolute bottom-[15%] right-[18%] rounded-md bg-brown-default/90 text-white px-4 py-2 text-sm'>
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
            colorClass='bg-blue-default'
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={5}
            colorClass='bg-red-default'
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={5}
            colorClass='bg-blue-default'
            className='w-full h-full'
          />

          <Tile
            col={1}
            row={3}
            colorClass='bg-yellow-default'
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={3}
            colorClass='bg-blue-default'
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={3}
            colorClass='bg-gray-300'
            className='w-full h-full'
          />
          <Tile
            col={7}
            row={3}
            colorClass='bg-red-default'
            className='w-full h-full'
          />
          <Tile
            col={9}
            row={3}
            colorClass='bg-yellow-default'
            className='w-full h-full'
          />

          <Tile
            col={1}
            row={1}
            colorClass='bg-blue-default'
            className='w-full h-full'
          />
          <Tile
            col={3}
            row={1}
            colorClass='bg-red-default'
            className='w-full h-full'
          />
          <Tile
            col={5}
            row={1}
            colorClass='bg-green-default'
            className='w-full h-full'
          />
          <Tile
            col={7}
            row={1}
            colorClass='bg-pink-default'
            className='w-full h-full'
          />
          <Tile
            col={9}
            row={1}
            colorClass='bg-blue-default'
            className='w-full h-full'
          />
        </div>
      </div>
    </div>
  )
}
