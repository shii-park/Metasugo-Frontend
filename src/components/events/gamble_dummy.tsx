'use client'

import React, { useState, useEffect } from 'react';

// --- 定数 ---
const MESSAGE_STEP0_TITLE = "【ギャンブルマス】";
const MESSAGE_STEP0_BODY = "カジノが近くにできたらしい！行ってみることにした！";
const MESSAGE_STEP1_TITLE = "ルール";
const MESSAGE_STEP1_BODY = [
  "サイコロを1回振り、出た目が",
  "3より大きい(ハイ)か 3以下(ロー)か予想しよう！",
  "当たったら賭け金の2倍が報酬となり、",
  "外れたら賭け金は没収となるよ"
];
const MESSAGE_STEP1_BUTTON = "理解した";

// --- Props の型定義 ---
type Props = {
  currentMoney: number;
  onUpdateMoney: (amount: number) => void;
  onClose: () => void;
};

// === ▼ DiceOverlay.tsx から移植 (ここから) ▼ ===

// サイコロの目の型 (1〜6)
type DiceFaceValue = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * サイコロの面（SVG）を描画するコンポーネント
 * (DiceOverlay.tsx からコピー)
 */
function DiceFace({
  value,
  size = 128,
}: {
  value: DiceFaceValue
  size?: number
}) {
  const pos = {
    tl: { cx: 24, cy: 24 },
    tm: { cx: 48, cy: 24 },
    tr: { cx: 72, cy: 24 },
    ml: { cx: 24, cy: 48 },
    mm: { cx: 48, cy: 48 },
    mr: { cx: 72, cy: 48 },
    bl: { cx: 24, cy: 72 },
    bm: { cx: 48, cy: 72 },
    br: { cx: 72, cy: 72 },
  } as const

  const map: Record<DiceFaceValue, Array<keyof typeof pos>> = {
    1: ['mm'],
    2: ['tl', 'br'],
    3: ['tl', 'mm', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'mm', 'bl', 'br'],
    6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'],
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 96 96'
      role='img'
      aria-label={`サイコロの目は ${value}`}
    >
      <rect
        x='4'
        y='4'
        width='88'
        height='88'
        rx='14'
        fill='white'
        stroke='rgba(0,0,0,0.08)'
        strokeWidth='2'
      />
      {map[value].map((k) => (
        <circle key={k} cx={pos[k].cx} cy={pos[k].cy} r={8} fill='black' />
      ))}
    </svg>
  )
}

// === ▲ DiceOverlay.tsx から移植 (ここまで) ▲ ===


// --- メインコンポーネント ---
export default function MoneyPlus({ currentMoney, onUpdateMoney, onClose }: Props) {
  
  // --- ステート管理 ---
  /**
   * 0: 導入, 1: ルール, 2: 賭け金
   * 3: ハイロー選択
   * 4: 演出中
   * 5: 結果
   */
  const [step, setStep] = useState(0); 
  
  const [betAmount, setBetAmount] = useState<string>("");
  const [betError, setBetError] = useState<string>("");
  const [choice, setChoice] = useState<'High' | 'Low' | null>(null);
  const [diceResult, setDiceResult] = useState(0); 
  const [gameWon, setGameWon] = useState(false); 
  const [resultAmount, setResultAmount] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 演出用の useEffect ---
  useEffect(() => {
    if (step === 4) { // 演出ステップ
      const animationDuration = 2000; // 2秒間
      const timer = setTimeout(() => {
        setStep(5); // 結果ステップへ
      }, animationDuration); 
      return () => clearTimeout(timer);
    }
  }, [step]); 

  // --- イベントハンドラー ---

  const handleAdvance = () => {
    if (step === 0) setStep(1);
    else if (step === 1) setStep(2);
    else if (step === 5) onClose(); 
  };

  const handleBetSubmit = () => {
    const bet = parseInt(betAmount, 10);
    if (isNaN(bet) || bet <= 0) {
      setBetError("有効な金額を入力してください");
      return;
    }
    if (bet > (currentMoney || 0)) { 
      setBetError(`所持金（${(currentMoney || 0).toLocaleString()}円）を超える金額は賭けられません`);
      return;
    }
    setBetError("");
    setStep(3); 
  };

  // (ダミーデータ版のまま)
  const handleChoiceSubmit = async () => {
    if (!choice) {
      setBetError("「ハイ」か「ロー」を選択してください");
      return;
    }
    if (isSubmitting) return;

    setBetError("");
    setIsSubmitting(true); 

    const bet = parseInt(betAmount, 10) || 100;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const didWin = true; // (ここでテスト)
    
    if (didWin) {
      setDiceResult(5); 
      setGameWon(true); 
      setResultAmount(bet); 
      onUpdateMoney(bet); 
    } else {
      setDiceResult(2); 
      setGameWon(false); 
      setResultAmount(bet); 
      onUpdateMoney(-bet); 
    }
    
    setStep(4); 
    setIsSubmitting(false);
  };

  // --- 各ステップの描画関数 ---

  // ステップ 0: 導入（吹き出し）
  const renderStep0 = () => (
    <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]"> 
      <div className="rounded-xl border-2 border-white/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
        <p className="font-bold mb-2">{MESSAGE_STEP0_TITLE}</p>
        <p className="text-sm md:text-base">{MESSAGE_STEP0_BODY}</p>
      </div>
      <div className="relative">
        <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
      </div>
    </div>
  );

  // ステップ 1: ルール説明（中央モーダル）
  const renderStep1 = () => (
    <div className="absolute z-50 inset-0 flex items-center justify-center p-4">
      <div 
        className="rounded-xl border-2 border-purple-300 bg-white/95 backdrop-blur-sm shadow-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className="text-xl font-bold text-center mb-4">{MESSAGE_STEP1_TITLE}</h2>
        <div className="text-sm md:text-base space-y-1 text-center">
          {MESSAGE_STEP1_BODY.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button 
            className="px-8 py-3 rounded-lg bg-gray-600 text-white font-bold text-lg" 
            onClick={handleAdvance} 
          >
            {MESSAGE_STEP1_BUTTON}
          </button>
        </div>
      </div>
    </div>
  );

  // ステップ 2: 賭け金入力
  const renderStep2 = () => (
    <div className="absolute z-50 inset-0 flex items-center justify-center p-4">
      <div 
        className="rounded-xl border-2 border-purple-300 bg-white/95 backdrop-blur-sm shadow-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className="text-xl font-bold text-center mb-4">賭け金を入力</h2>
        <div className="relative w-full max-w-xs mx-auto">
          <input 
            type="number" 
            value={betAmount}
            onChange={(e) => {
              setBetError(""); 
              setBetAmount(e.target.value);
            }}
            className="w-full text-2xl font-bold text-right p-3 pr-16 border-2 border-yellow-700 rounded-lg"
            placeholder="0"
            disabled={isSubmitting} 
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold">円</span>
        </div>
        <p className="text-sm text-center mt-1">
          所持金: {(currentMoney || 0).toLocaleString()}円
        </p>
        {betError && (
          <p className="text-red-600 text-sm text-center mt-4">{betError}</p>
        )}
        <div className="mt-6 text-center">
          <button 
            className="px-8 py-3 rounded-lg bg-gray-600 text-white font-bold text-lg disabled:bg-gray-400" 
            onClick={handleBetSubmit} 
            disabled={isSubmitting || !betAmount} 
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );

  // ステップ 3: ハイロー選択
  const renderStep3 = () => (
    <div className="absolute z-50 inset-0 flex items-center justify-center p-4">
      <div 
        className="rounded-xl border-2 border-purple-300 bg-white/95 backdrop-blur-sm shadow-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <p className="text-sm text-left font-bold mb-2 text-gray-700">
          賭け金: {parseInt(betAmount, 10).toLocaleString()}円
        </p>
        <h2 className="text-xl font-bold text-center mt-6 mb-4">ハイ＆ロー</h2>
        <p className="text-center text-sm mb-4">サイコロの目は3より大きい？小さい？</p>
        <div className="flex justify-around gap-4 mb-6">
          <button 
            className={`w-1/2 py-3 rounded-lg font-bold text-white transition-all ${choice === 'High' ? 'bg-purple-700 ring-2 ring-purple-900' : 'bg-purple-500 hover:bg-purple-600'}`}
            onClick={() => {
              setChoice('High');
              setBetError("");
            }}
            disabled={isSubmitting} 
          >
            ハイ (4, 5, 6)
          </button>
          <button 
            className={`w-1/2 py-3 rounded-lg font-bold text-white transition-all ${choice === 'Low' ? 'bg-purple-700 ring-2 ring-purple-900' : 'bg-purple-500 hover:bg-purple-600'}`}
            onClick={() => {
              setChoice('Low');
              setBetError("");
            }}
            disabled={isSubmitting} 
          >
            ロー (1, 2, 3)
          </button>
        </div>
        {betError && (
          <p className="text-red-600 text-sm text-center mb-4 -mt-2">{betError}</p>
        )}
        <div className="mt-6 text-center">
          <button 
            className="px-8 py-3 rounded-lg bg-gray-600 text-white font-bold text-lg disabled:bg-gray-400" 
            onClick={handleChoiceSubmit} 
            disabled={isSubmitting || !choice} 
          >
            {isSubmitting ? "通信中..." : "決定"}
          </button>
        </div>
      </div>
    </div>
  );

  // --- ▼▼▼ ここからが演出部分 (DiceOverlay参考に修正) ▼▼▼ ---

  /**
   * ステップ 4: 演出用コンポーネント
   * (目がパタパタと切り替わるアニメーション)
   */
  const DiceRollAnimation = () => {
    // 1〜6の目を順番に切り替えるステート
    const [rollingFace, setRollingFace] = useState<DiceFaceValue>(1);

    useEffect(() => {
      // 100ms ごとに表示する目を 1 -> 2 -> ... -> 6 -> 1 と変える
      // (DiceOverlay.tsx のロジックを参考に、速度を100msに調整)
      const rollInterval = setInterval(() => {
        setRollingFace((prev) => ((prev % 6) + 1) as DiceFaceValue);
      }, 100); 

      // この演出画面が消えるときにインターバルを停止する
      return () => clearInterval(rollInterval);
    }, []); // マウント時に1回だけ実行

    return (
      <div className="flex justify-center items-center h-40">
        {/* DiceFace (SVG) コンポーネントを呼び出す */}
        <DiceFace value={rollingFace} size={160} />
      </div>
    );
  };

  /**
   * ステップ 4: 演出画面 (DiceRollAnimation を呼び出す)
   */
  const renderStep4 = () => (
    <div className="absolute z-50 inset-0 flex items-center justify-center p-4">
      <div 
        className="rounded-xl border-2 border-purple-300 bg-white/95 backdrop-blur-sm shadow-lg p-6 w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-center mb-4">運命のダイスロール！</h2>
        
        {/* SVGを使った演出コンポーネントを呼び出す */}
        <DiceRollAnimation />
        
        <p className="text-center text-sm mt-4 text-gray-700">結果を待っています...</p>
      </div>
    </div>
  );
  
  // --- ▲▲▲ 演出部分ここまで ▲▲▲ ---


  // ステップ 5: 結果表示
  const renderStep5 = () => {
    const isWin = gameWon;
    const message1 = isWin ? "賭けに勝った！" : "賭けに負けた…";
    const message2 = isWin 
      ? `${resultAmount.toLocaleString()}円 取得`
      : `${resultAmount.toLocaleString()}円 没収`;

    return (
      <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]"> 
        <div className={`rounded-xl border-2 ${isWin ? 'border-yellow-400' : 'border-blue-400'} bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5`}>
          <p className="text-center text-lg font-bold mb-2">
            サイコロの目は...「 {diceResult} 」！
          </p>
          <p className={`font-bold mb-2 text-lg text-center ${isWin ? 'text-yellow-700' : 'text-blue-700'}`}>
            {message1}
          </p>
          <p className="text-sm md:text-base text-center">
            {message2}
          </p>
        </div>
        <div className="relative">
          <div className="absolute right-8 -bottom-3 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
        </div>
      </div>
    );
  };
  
  // --- メインレンダー ---
  const renderCurrentStep = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3(); 
      case 4: return renderStep4(); 
      case 5: return renderStep5(); 
      default: return null;
    }
  };

  return (
    <div 
      className="absolute z-50 inset-0 cursor-pointer" 
      onClick={
        (step === 0 || step === 1 || step === 5) ? handleAdvance : undefined
      } 
    >
      <div className='absolute inset-0 bg-black/20' />
      {renderCurrentStep()}
    </div>
  );
}