// app/test-quiz/page.tsx
'use client' 

import { useState } from 'react'

// 1. 改良した Quiz コンポーネントをインポート
import Quiz from '@/components/events/Quiz' 

export default function TestQuizPage() {
  // コンポーネントの表示・非表示
  const [isVisible, setIsVisible] = useState(true)
  
  // --- ▼▼▼ ここから追加 (Gambleのテストページと同様) ▼▼▼ ---

  // 2. テスト用の「所持金」を管理する
  const [myMoney, setMyMoney] = useState(10000); // 初期所持金

  // 3. Quizコンポーネントに渡すための「所持金更新」関数
  const handleUpdateMoney = (amount: number) => {
    // Quiz コンポーネントから変動額 (amount) が渡されてくる
    // (正解: +5000, 不正解: +0)
    setMyMoney((prevMoney) => prevMoney + amount);
    console.log(`所持金が ${amount} 変動しました。現在: ${myMoney + amount}円`);
  };

  // --- ▲▲▲ ここまで追加 ▲▲▲ ---

  // 4. Quizコンポーネントに渡すための「閉じる」関数
  const handleCloseDialog = () => {
    setIsVisible(false)
    console.log('Quizダイアログが閉じられました！')
  }

  return (
    <div className="relative w-full h-screen bg-gray-200 p-8">
      <h1 className="text-xl font-bold">コンポーネントのテストページ</h1>
      
      {/* 5. 現在の所持金を表示（確認用） */}
      <p className="text-lg font-semibold my-4">
        現在の所持金: {myMoney.toLocaleString()}円
      </p>

      {isVisible && (
        // 6. 2つの props を渡す
                <Quiz 
                  currentMoney={myMoney} // 追加
                  onUpdateMoney={handleUpdateMoney} // 必須
                  onClose={handleCloseDialog}      // 必須
                />
      )}

      {!isVisible && (
        <button
          onClick={() => {
            setIsVisible(true);
            // 所持金はリセットせず、そのまま再挑戦
          }}
          className="mt-4 px-4 py-2 rounded bg-green-600 text-white"
        >
          もう一度クイズに挑戦
        </button>
      )}
    </div>
  )
}