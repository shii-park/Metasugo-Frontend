// src/components/events/Neighbor.tsx
'use client'

import { useGameStore } from '@/lib/game/store'; // ★ インポート追加
import React, { useMemo, useState } from 'react'; // ★ インポート追加

// ★ 修正点: Props を (Gamble.tsx と同じように) 定義
type Props = {
  currentMoney: number;
  onUpdateMoney: (newTotal: number) => void;
  onClose: () => void;
  eventMessage: string | null | undefined; // (これは元のコードから)
}

// ★ 修正点: Props を受け取る
export default function Neighbor({ currentMoney, onUpdateMoney, onClose, eventMessage }: Props) {
  const [showContent, setShowContent] = useState(false)

  // ★ 修正点: 差額(delta)はストアから読み取る
  const moneyChange = useGameStore((s) => s.moneyChange)
  const clearMoneyChange = useGameStore((s) => s.clearMoneyChange)

  const handleAdvance = () =>{
    if (showContent){
      // ★ 修正点: 親(page.tsx)の所持金を更新
      const delta = moneyChange?.delta ?? 0
      
      // 差額が0でない場合のみ所持金を更新
      if (delta !== 0) {
        const newTotal = currentMoney + delta
        onUpdateMoney(newTotal) // page.tsx の setMoney(newTotal) を呼び出す
      }
      
      clearMoneyChange() // ストアの差額をクリア
      onClose(); // モーダルを閉じる
    }else{
      setShowContent(true);
    }
  };

  const isTitleOnly = !showContent;
  // page.tsx から渡される eventMessage を表示
  const contentLines = (eventMessage ?? '').split('\n');

  return (
    <div className="absolute z-50 inset-0 cursor-pointer" onClick={handleAdvance}>
      <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
        <div className="rounded-xl border-2 border-white/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
          {isTitleOnly ? (
            <p className="font-bold mb-2 text-[#5B7BA6]">【隣人効果マス】</p>
          ) : (
            <div className="font-bold text-sm md:text-base text-[#5B7BA6]">
              {contentLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
        </div>
      </div>
      <div className='absolute inset-0 bg-black/20'/>
    </div>
  )
}