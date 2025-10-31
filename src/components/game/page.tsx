'use client';

import { useState, useEffect } from 'react';
import GameBoard from './GameBoard'; // GameBoardコンポーネントをインポート

// --- テスト用のダミーのボードレイアウトデータ ---
// ★ 要変更: あなたのゲームのレイアウトに合わせてください
const COLS = 10; // ボードの列数 (GameBoard.tsx の BOARD_COLS と合わせる)
const ROWS = 10; // ボードの行数 (仮)

// 各マスの幅 (%) を均等に分割
const dummyColsPct = Array(COLS).fill(100 / COLS);
// 各マスの高さ (%) を均等に分割
const dummyRowsPct = Array(ROWS).fill(100 / ROWS);
// ------------------------------------------------

export default function GameTestPage() {
  // 1. 自分の位置情報を state で管理
  const [myPosition, setMyPosition] = useState(1);

  // 2. 自分の位置を数秒ごとに動かすシミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      setMyPosition(prevPos => {
        const nextPos = prevPos + 1;
        // マスの最大数 (10x10=100) を超えたら 1 に戻る
        return nextPos > (COLS * ROWS) ? 1 : nextPos;
      });
    }, 2000); // 2秒ごとに動く

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">GameBoard テストページ</h1>
      
      {/* ボードが目に見えるようにサイズと背景色を指定したラッパー */}
      <div 
        className="relative w-[80vw] h-[80vh] max-w-[600px] max-h-[600px] border-4 border-gray-700 bg-green-200 shadow-lg"
      >
        <GameBoard
          // --- レイアウトprops ---
          colsPct={dummyColsPct}
          rowsPct={dummyRowsPct}
          padXPct={5}       // 左右のパディング 5% (仮)
          padTopPct={5}     // 上のパディング 5% (仮)
          padBottomPct={5}  // 下のパディング 5% (仮)

          // --- 自分のプレイヤーprops ---
          myUserId="my-test-id"
          myPosition={myPosition} // stateを渡す
          myLabel="あなた"
          myImgSrc="/player1.png"
        />
      </div>
      <p className="mt-4 text-gray-600">
        自分のプレイヤーが2秒ごとに動きます。<br />
        他のプレイヤーを動かすには、ステップ2の修正を行ってください。
      </p>
    </main>
  );
}