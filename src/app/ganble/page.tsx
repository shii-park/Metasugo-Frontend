// app/test-component/page.tsx
'use client' 

import { useState } from 'react'

// 1. あなたが作ったコンポーネントをインポートします
import Gamble from '@/components/events/Gamble' 

export default function TestPage() {
  const [isVisible, setIsVisible] = useState(true)
  
  // --- ▼▼▼ ここから追加 ▼▼▼ ---

  // 2. テスト用の「所持金」を管理する State を作る
  //    (これが currentMoney の中身になります)
  const [myMoney, setMyMoney] = useState(10000); // 必ず初期値（例: 10000）を入れる

  // 3. Gambleコンポーネントに渡すための「所持金更新」関数を作る
  const handleUpdateMoney = (amount: number) => {
    // Gamble コンポーネントから変動額 (amount) が渡されてくる
    // (例: 勝ったら +50, 負けたら -50)
    setMyMoney((prevMoney) => prevMoney + amount);
    console.log(`所持金が ${amount} 変動しました`);
  };

  // --- ▲▲▲ ここまで追加 ▲▲▲ ---

  // 4. Gambleコンポーネントに渡すための「閉じる」関数
  const handleCloseDialog = () => {
    setIsVisible(false)
    console.log('ダイアログが閉じられました！')
  }

  return (
    <div className="relative w-full h-screen bg-gray-200 p-8">
      <h1 className="text-xl font-bold">コンポーネントのテストページ</h1>
      
      {/* 5. 現在の所持金を表示（確認用） */}
      <p>現在の所持金: {myMoney.toLocaleString()}円</p>

      {isVisible && (
        // 6. 3つの props をすべて渡す
        <Gamble 
          currentMoney={myMoney}        // 必須
          onUpdateMoney={handleUpdateMoney} // 必須
          onClose={handleCloseDialog}   // 必須
        />
      )}

      {!isVisible && (
        <button
          onClick={() => {
            setIsVisible(true);
            setMyMoney(10000); // （おまけ）再挑戦時に所持金をリセット
          }}
          className="mt-4 px-4 py-2 rounded bg-green-600 text-white"
        >
          もう一度ギャンブル
        </button>
      )}
    </div>
  )
}