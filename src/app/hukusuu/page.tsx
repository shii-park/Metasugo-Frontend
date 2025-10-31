'use client';

import { useState, useEffect } from 'react';
import GameBoard from '@/components/game/gameboard'; // GameBoardコンポーネントをインポート

// -----------------------------------------------------------------
// ★★★ テスト用レイアウト ★★★
// -----------------------------------------------------------------
// ★ 要変更: 
// GameBoard.tsx の TILE_COORDINATE_MAP (6列x3行) に合わせた
// 実際のレイアウト (%) を指定してください。
// Playerコンポーネントが期待する値を設定する必要があります。

// 仮: 6列 (均等割り)
const realColsPct = [16.66, 16.66, 16.66, 16.66, 16.66, 16.66]; 
// 仮: 3行 (均等割り)
const realRowsPct = [33.33, 33.33, 33.33]; 

// ★ 要変更: GameBoard.tsx の TOTAL_TILES と合わせる
const TOTAL_TILES = 17; // 0から16までの17マス
// -----------------------------------------------------------------


export default function GameTestPage() {
  // 自分の位置 (0 = スタートマス)
  const [myPosition, setMyPosition] = useState(0);

  // 自分の位置を数秒ごとに動かすシミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      // 0〜16 の範囲でループするように修正
      setMyPosition(prevPos => (prevPos + 1) % TOTAL_TILES);
    }, 2000); // 2秒ごとに動く

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">GameBoard テストページ (すごろく版)</h1>
      
      {/* ラッパーに実際のゲームボードの背景画像を指定してください
      */}
      <div 
        className="relative w-[80vw] h-[80vh] max-w-[800px] max-h-[600px] border-4 border-gray-700 shadow-lg"
        // ★ ヒント: style={{ backgroundImage: "url('/board-background.png')", ... }}
        // のように、すごろくの背景画像を指定するとテストしやすくなります
      >
        <GameBoard
          // --- レイアウトprops (実際のデータに差し替え) ---
          colsPct={realColsPct}
          rowsPct={realRowsPct}
          padXPct={5}       // 仮
          padTopPct={5}     // 仮
          padBottomPct={5}  // 仮

          // --- 自分のプレイヤーprops ---
          myUserId="my-test-id"
          myPosition={myPosition} // stateを渡す (0からスタート)
          myLabel="あなた"
          myImgSrc="/player1.png"
        />
      </div>
      <p className="mt-4 text-gray-600">
        「あなた」が2秒ごと、「テストプレイヤー」が2.5秒ごとに動きます。
      </p>
    </main>
  );
}