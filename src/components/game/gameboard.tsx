'use client';

import { useState, useEffect } from 'react';
import Player from './Player'; 

// --- 型定義 (ここが追加・修正点) ---
type OtherPlayer = {
  position: number;
  label: string;
  imgSrc: string;
};

type OtherPlayersState = {
  [key: string]: OtherPlayer;
};
// --- 型定義ここまで ---


const OTHER_AVATARS = [
  '/player2.png',
  '/player3.png',
  '/player4.png',
  '/player5.png',
];

const BOARD_COLS = 10; // ★ 要変更

/**
 * タイルID (1始まり) を座標 (col, row) (1始まり) に変換
 * (引数に number 型を追加)
 */
function getCoordsFromTileId(tileId: number) {
  if (tileId <= 0) {
    return { col: 1, row: 1 }; 
  }
  const zeroBasedId = tileId - 1; 

  const row = Math.floor(zeroBasedId / BOARD_COLS) + 1; 
  const col = (zeroBasedId % BOARD_COLS) + 1;         

  return { col, row };
}

type GameBoardProps = {
  colsPct: number[];
  rowsPct: number[];
  padXPct: number;
  padTopPct: number;
  padBottomPct: number;

  myUserId: string;
  myPosition: number; 
  myLabel: string;
  myImgSrc: string;
};

export default function GameBoard({
  colsPct,
  rowsPct,
  padXPct,
  padTopPct,
  padBottomPct,
  
  myUserId = "player1", 
  myPosition = 1,       
  myLabel = "あなた",
  myImgSrc = "/player1.png"
}: GameBoardProps) {

  // --- useStateの修正 (型を指定) ---
  const [otherPlayers, setOtherPlayers] = useState<OtherPlayersState>({});

  const playerLayoutProps = {
    colsPct,
    rowsPct,
    padXPct,
    padTopPct,
    padBottomPct,
  };

  useEffect(() => {
    // ★ 要変更: 実際のWebSocketサーバーのエンドポイントURL
    const ws = new WebSocket('wss://your-game-server.com/ws');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'PLAYER_MOVED') {
          const { userId, newPosition } = data.payload;

          if (userId !== myUserId) {
            
            // prevPlayers にも OtherPlayersState 型が推論されるようになる
            setOtherPlayers(prevPlayers => {
              const existingPlayer = prevPlayers[userId]; // (エラーが消える)

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
                // 新規プレイヤー
                const randomIndex = Math.floor(Math.random() * OTHER_AVATARS.length);
                const newImgSrc = OTHER_AVATARS[randomIndex];
                
                const newPlayerNumber = Object.keys(prevPlayers).length + 2;
                const newLabel = `プレイヤー${newPlayerNumber}`;

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
          }
        }
      } catch (error) {
        console.error("WebSocket メッセージの処理エラー:", error);
      }
    };

    return () => {
      ws.close();
    };
    
  }, [myUserId]); 

  const { col: myCol, row: myRow } = getCoordsFromTileId(myPosition);

  return (
    <div className="relative w-full h-full">
      {/* 1. 自分のプレイヤーを描画 */}
      <Player
        col={myCol}
        row={myRow}
        label={myLabel}
        imgSrc={myImgSrc}
        {...playerLayoutProps}
      />

      {/* 2. 他のプレイヤーを描画 */}
      {/* otherPlayers に型が付いたため、
        playerData も OtherPlayer 型として正しく推論される 
      */}
      {Object.entries(otherPlayers).map(([userId, playerData]) => {
        // playerData.position などへのアクセスでエラーが消える
        const { col, row } = getCoordsFromTileId(playerData.position); 
        
        return (
          <Player
            key={userId}
            col={col}
            row={row}
            label={playerData.label}   // (エラーが消える)
            imgSrc={playerData.imgSrc} // (エラーが消える)
            {...playerLayoutProps}
          />
        );
      })}
    </div>
  );
}