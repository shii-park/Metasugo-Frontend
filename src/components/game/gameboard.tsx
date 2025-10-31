'use client';

import { useState, useEffect } from 'react';
import Player from './Player'; // あなたが作成したPlayerコンポーネントをインポート

// 他プレイヤー1人分のデータ構造を定義
type OtherPlayer = {
  position: number;
  label: string;
  imgSrc: string;
};

// otherPlayersステート全体の型を定義
// (キーがuserIdの文字列で、値がOtherPlayerのオブジェクト)
type OtherPlayersState = {
  [key: string]: OtherPlayer;
};

// --- 他プレイヤーのアバターリスト ---
// (player1.pngは自分用なので含めない)
const OTHER_AVATARS = [
  '/player2.png',
  '/player3.png',
  '/player4.png',
  '/player5.png',
];

// --- ボードの列数 (レイアウトに合わせて変更) ---
// ★ 要変更: 
// 例: 10x10のグリッドなら 10
const BOARD_COLS = 10; 
const BOARD_ROWS = 
/**
 * タイルID (1始まり) を座標 (col, row) (1始まり) に変換する関数
 * ★ 要変更: ボードのレイアウトに合わせてロジックを修正してください
 */
function getCoordsFromTileId(tileId: number) {
  if (tileId <= 0) {
    return { col: 1, row: 1 }; // 念のためフォールバック
  }
  // タイルIDを 0 ベースに調整
  const zeroBasedId = tileId - 1; 

  const row = Math.floor(zeroBasedId / BOARD_COLS) + 1; // 1ベースの行
  const col = (zeroBasedId % BOARD_COLS) + 1;         // 1ベースの列

  return { col, row };
}

// GameBoardコンポーネント (仮のprops)
// 実際には親コンポーネントからこれらのpropsを受け取る想定
type GameBoardProps = {
  colsPct: number[];
  rowsPct: number[];
  padXPct: number;
  padTopPct: number;
  padBottomPct: number;

  // ★ 要変更: 自分のプレイヤー情報をpropsで受け取る例
  myUserId: string;
  myPosition: number; // 自分のタイルID
  myLabel: string;
  myImgSrc: string;
};

export default function GameBoard({
  // ボードレイアウト用のprops
  colsPct,
  rowsPct,
  padXPct,
  padTopPct,
  padBottomPct,
  
  // 自分のプレイヤー情報
  myUserId = "player1", // 仮
  myPosition = 1,       // 仮
  myLabel = "あなた",
  myImgSrc = "/player1.png"
}: GameBoardProps) {

  // 他の全プレイヤーの状態を管理
  // 例: { "player2": { position: 1, label: "プレイヤー2", imgSrc: "/player3.png" }, ... }
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayersState>({});

  // ボードレイアウトpropsをPlayerコンポーネントに渡すためにまとめる
  const playerLayoutProps = {
    colsPct,
    rowsPct,
    padXPct,
    padTopPct,
    padBottomPct,
  };

  // --- WebSocketによるリアルタイム通信 ---
  useEffect(() => {
    // 2.5秒ごとにダミーの "PLAYER_MOVED" イベントを発生させる
    const interval = setInterval(() => {
      // 2人のダミープレイヤーをランダムに動かす
      const dummyUserIds = ["test-player-2", "test-player-3"];
      const userId = dummyUserIds[Math.floor(Math.random() * dummyUserIds.length)];
      const newPosition = Math.floor(Math.random() * (COLS * ROWS)) + 1; // 1-100のランダムな位置

      // ws.onmessage の中身とほぼ同じロジックを実行
      // (myUserId チェックは不要なので削除)
      setOtherPlayers(prevPlayers => {
        const existingPlayer = prevPlayers[userId];

        if (existingPlayer) {
          // 既存プレイヤー
          return {
            ...prevPlayers,
            [userId]: {
              ...existingPlayer,
              position: newPosition
            }
          };
        } else {
          // 新規プレイヤー (ランダムアバター割り当てロジック)
          const randomIndex = Math.floor(Math.random() * OTHER_AVATARS.length);
          const newImgSrc = OTHER_AVATARS[randomIndex];
          
          const newPlayerNumber = Object.keys(prevPlayers).length + 2;
          const newLabel = `テスト${newPlayerNumber}`;

          return {
            ...prevPlayers,
            [userId]: {
              position: newPosition,
              label: newLabel,
              imgSrc: newImgSrc
            }
          };
        }
      });
      
    }, 2500); // 2.5秒ごとに誰かが動く

    // コンポーネントが消えるときにインターバルを停止
    return () => {
      clearInterval(interval);
    };
    
  }, []); // 依存配列は空にする (myUserId に依存させない)

  // --- 自分の座標を計算 ---
  const { col: myCol, row: myRow } = getCoordsFromTileId(myPosition);

  return (
    // ボード全体（基準位置）
    <div className="relative w-full h-full">
      {/* (ここにボードの画像やマス目などを描画) */}
      
      {/* 1. 自分のプレイヤーを描画 */}
      <Player
        col={myCol}
        row={myRow}
        label={myLabel}
        imgSrc={myImgSrc}
        {...playerLayoutProps}
      />

      {/* 2. 他のプレイヤーを描画 */}
      {Object.entries(otherPlayers).map(([userId, playerData]) => {
        // サーバーから来た position (タイルID) を col, row に変換
        const { col, row } = getCoordsFromTileId(playerData.position);
        
        return (
          <Player
            key={userId}
            col={col}
            row={row}
            label={playerData.label}
            imgSrc={playerData.imgSrc}
            {...playerLayoutProps}
          />
        );
      })}
    </div>
  );
}