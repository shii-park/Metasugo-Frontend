'use client'

import { useGameStore } from '@/lib/game/store' // 差額(delta)の読み取りに必要
import React, { useMemo, useState } from 'react';

// ★ 修正点: Props を (Gamble.tsx と同じように) 定義
type Props = {
  currentMoney: number;
  onUpdateMoney: (newTotal: number) => void;
  onClose: () => void;
}

// ★ 修正点: Props を受け取る
export default function MoneyPlus({ currentMoney, onUpdateMoney, onClose }: Props) {
  const [showContent, setShowContent]=useState(false);

  // 差額(delta)はストアから読み取る
  const moneyChange = useGameStore((s) => s.moneyChange)
  const clearMoneyChange = useGameStore((s) => s.clearMoneyChange)

  // 絶対値で表示（null/負なら0に）
  const deltaAbs = useMemo(() => {
    const d = moneyChange?.delta ?? 0
    return d > 0 ? d : 0 // プラスの時だけ表示
  }, [moneyChange])

  const handleAdvance = () => {
    if (showContent) {
      // ★ 修正点: 親(page.tsx)の所持金を更新
      const delta = moneyChange?.delta ?? 0
      const newTotal = currentMoney + delta // (delta はプラスのはず)
      
      // page.tsx の setMoney(newTotal) を呼び出す
      onUpdateMoney(newTotal) 
      
      clearMoneyChange(); // ストアの差額をクリア
      onClose(); // モーダルを閉じる
    } else {
      setShowContent(true);
    }
  };

  const isTitleOnly = !showContent;
  const contentLines = [`所持金が ${deltaAbs.toLocaleString()} 円増えた`]

  return (
    <div className="absolute z-50 inset-0 cursor-pointer" onClick={handleAdvance}>
      <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
        <div className="rounded-xl border-2 border-white/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
          {isTitleOnly ? (
            <p className="font-bold mb-2 text-[#5B7BA6]">【お金増加マス】</p> 
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