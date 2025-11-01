"use client";

import { useEffect, useState } from "react";
import { connectGameSocket, type GameSocketConnection } from "../../lib/game/wsClient";
import { useIdToken } from "@/lib/firebase/useIdToken"; // useIdTokenをインポート

export default function Example() {
    const [isStatus, setIsStatus] = useState(false);
    const { token } = useIdToken(); // tokenを取得

    // プレイヤーの初期ステータス（デフォルト値）
    const [playerStatus, setPlayerStatus] = useState({
        isMarried: false, // 結婚していない
        job: "", // 職業なし
        hasChildren: 0, // 子供0人
    });

    useEffect(() => {
        if (!token) return; // tokenがなければ何もしない

        // WebSocket 接続
        const socket: GameSocketConnection = connectGameSocket({
            onPlayerStatusChanged: (userID, status, value) => {
            console.log("PLAYER_STATUS_CHANGED 受信:", userID, status, value);

            setPlayerStatus((prev) => {
                // 現在の状態をコピーして更新
                const next = { ...prev };

                if (status === "isMarried") {
                    next.isMarried = Boolean(value);
                } else if (status === "job") {
                    if (value === "professor") {
                        next.job = "コース長";
                    } else if (value === "lecturer") {
                        next.job = "平教員";
                    } else {
                        next.job = "なし";
                    }
                } else if (status === "hasChildren") {
                    next.hasChildren = Number(value) || 0;
                }

                return next;
            });
        },
    }, token); // tokenを渡す

    return () => socket.close();
    }, [token]); // tokenを依存配列に追加

    return (
        <div className="flex items-start rounded-md bg-black/50 text-white h-[100px]">
            {isStatus ? (
                // ＞ ボタンのみ表示
                <button className="px-3 pt-1" onClick={() => setIsStatus(false)}>
                    ＞
                </button>
            ) : (
                // ＜ ボタン＋情報表示
                <div className="flex items-start">
                    <button className="pl-3 pt-1" onClick={() => setIsStatus(true)}>
                        ＜
                    </button>
                    <div>
                        <div className="px-4 py-1">
                            結婚：{playerStatus.isMarried ? "している" : "していない"}
                        </div>
                        <div className="px-4 py-1">
                            職業：{playerStatus.job || "なし"}
                        </div>
                        <div className="px-4 py-1">
                            子供：{playerStatus.hasChildren}人
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
