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
        <Tile x={10} y={80} colorClass='bg-yellow-default' />
        <Tile x={22} y={80} colorClass='bg-blue-default' />
        <Tile x={34} y={80} colorClass='bg-red-default' />
        <Tile x={46} y={80} colorClass='bg-green-default' />
        <Tile x={58} y={80} colorClass='bg-pink-default' />
        <Tile x={70} y={80} colorClass='bg-blue-default' />
        <Tile x={10} y={60} colorClass='bg-gray-light' />
        <Tile x={22} y={60} colorClass='bg-red-default' />
        <Tile x={34} y={60} colorClass='bg-gray-light' />
        <Tile x={46} y={60} colorClass='bg-red-default' />
        <Tile x={58} y={60} colorClass='bg-yellow-default' />
        <Tile x={10} y={40} colorClass='bg-blue-default' />
        <Tile x={22} y={40} colorClass='bg-red-default' />
        <Tile x={34} y={40} colorClass='bg-blue-default' />
        <Tile x={46} y={40} colorClass='bg-red-default' />
        <Tile x={58} y={40} colorClass='bg-yellow-default' />
      </div>
    </div>
  )
}
