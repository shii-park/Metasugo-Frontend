// app/test-component/page.tsx
'use client' 

import { useState } from 'react'

// 1. "gamble_dummy.tsx" からコンポーネントをインポートします
// (コンポーネント名は MoneyPlus のままだと仮定します)
import MoneyPlus from '@/components/events/gamble_dummy' 

export default function TestPage() {
  const [isVisible, setIsVisible] = useState(true)
  
  // 2. 所持金を管理する State (これが currentMoney になる)
  const [myMoney, setMyMoney] = useState(10000); // 初期値 10000円

  // 3. 所持金更新用の関数 (これが onUpdateMoney になる)
  const handleUpdateMoney = (amount: number) => {
    // MoneyPlus から変動額 (amount) が渡されてくる
    setMyMoney((prevMoney) => prevMoney + amount);
    console.log(`所持金が ${amount} 変動しました`);
  };

  // 4. 閉じる用の関数 (これが onClose になる)
  const handleCloseDialog = () => {
    setIsVisible(false)
    console.log('ダイアログが閉じられました！')
  }

  return (
    <div className="relative w-full h-screen bg-gray-200 p-8">
      <h1 className="text-xl font-bold">コンポーネントのテストページ</h1>
      
      {/* 現在の所持金を表示（確認用） */}
      <p>現在の所持金: {myMoney.toLocaleString()}円</p>

      {/* 5. isVisible が true の時だけコンポーネントを表示 */}
      {isVisible && (
        <MoneyPlus 
          currentMoney={myMoney}        // 必須 props
          onUpdateMoney={handleUpdateMoney} // 必須 props
          onClose={handleCloseDialog}   // 必須 props
        />
      )}

      {/* 6. （おまけ）非表示になった後、もう一度表示するためのボタン */}
      {!isVisible && (
        <button
          onClick={() => {
            setIsVisible(true);
            setMyMoney(10000); // 再挑戦時に所持金を10000円にリセット
          }}
          className="mt-4 px-4 py-2 rounded bg-green-600 text-white"
        >
          もう一度ギャンブル
        </button>
      )}
    </div>
  )
}