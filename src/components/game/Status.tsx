"use client";
import { useState } from "react";

export default function Example() {
  // false → 「＜」側、 true → 「＞」側を表示
    const [isStatus, setIsStatus] = useState(false);

    return (
        <div className="flex items-start rounded-md bg-black/50 text-white h-[100px]">
            {isStatus ? (
                // ＞ ボタンのとき
                <button
                    className="px-3 pt-1"
                    onClick={() => setIsStatus(false)} // クリックで左に戻す
                >
                    ＞
                </button>
            ) : (
                // ＜ ボタン＋情報のとき
                <div className="flex items-start">
                    <button
                        className="pl-3 pt-1"
                        onClick={() => setIsStatus(true)} // クリックで右に切り替え
                    >
                        ＜
                    </button>
                    <div>
                        <div className="px-4 py-1">結婚：している</div>
                        <div className="px-4 py-1">職業：コース長</div>
                        <div className="px-4 py-1">子供：11人</div>
                    </div>
                </div>
            )}
        </div>
    );
}
