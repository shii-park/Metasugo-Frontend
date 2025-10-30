// app/test-component/page.tsx
'use client' // ← これを忘れずに

import { useState } from 'react'

// 1. 今回のコンポーネントをインポートします
// (パスはご自身の環境に合わせて修正してください)
import MoneyMinus from '@/components/events/MoneyMinus' 

export default function TestPage() {
  // コンポーネントの「表示・非表示」を管理
  const [isVisible, setIsVisible] = useState(true)

  // MoneyMinus コンポーネントに渡すための関数
  // 2回目のクリックでこれが呼ばれ、非表示になります
  const handleCloseDialog = () => {
    setIsVisible(false)
    console.log('MoneyMinus ダイアログが閉じられました！')
  }

  return (
    // 背景となるダミーのページ
    <div className="relative w-full h-screen bg-gray-200 p-8">
      <h1 className="text-xl font-bold">コンポーネントのテストページ</h1>
      <p>このページで MoneyMinus コンポーネントの表示を確認します。</p>

      {/* isVisible が true の時だけ、MoneyMinus コンポーネントを表示する */}
      {isVisible && (
        <MoneyMinus onClose={handleCloseDialog} />
      )}

      {/* （おまけ）非表示になった後、もう一度表示するためのボタン */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="mt-4 px-4 py-2 rounded bg-green-600 text-white"
        >
          もう一度表示
        </button>
      )}
    </div>
  )
}