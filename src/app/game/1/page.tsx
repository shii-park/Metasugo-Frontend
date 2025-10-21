'use client'
import Dice from '@/components/game/Dice'
import GameHUD from '@/components/game/GameHUD'
import SettingsMenu from '@/components/game/SettingMenu'
import Tile from '@/components/game/Tile'
import Image from 'next/image'

export default function Game() {
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
        <Dice
          className='absolute right-[3%] bottom-[3%]'
          onRoll={() => alert('サイコロをふる！')}
        />
        <div className='absolute inset-0 grid grid-cols-10 grid-rows-5 px-[3%] py-[5%]'>
          <Tile col={2} row={5} colorClass='bg-blue-default' />
          <Tile col={4} row={5} colorClass='bg-red-default' />
          <Tile col={6} row={5} colorClass='bg-green-default' />

          <Tile col={2} row={3} colorClass='bg-blue-default' />
          <Tile col={4} row={3} colorClass='bg-red-default' />
          <Tile col={6} row={3} colorClass='bg-green-default' />
          <Tile col={8} row={3} colorClass='bg-blue-default' />
          <Tile col={10} row={3} colorClass='bg-red-default' />

          <Tile col={2} row={1} colorClass='bg-blue-default' />
          <Tile col={4} row={1} colorClass='bg-red-default' />
          <Tile col={6} row={1} colorClass='bg-green-default' />
          <Tile col={8} row={1} colorClass='bg-blue-default' />
          <Tile col={10} row={1} colorClass='bg-red-default' />
        </div>
      </div>
    </div>
  )
}
