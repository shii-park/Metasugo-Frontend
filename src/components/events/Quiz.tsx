'use client'

import { useGameStore } from '@/lib/game/store'
import { useMemo, useRef, useState } from 'react'

// 1. JSONデータの型定義
type QuizData = {
  id: number;
  question: string;
  options: [string, string];
  answerIndex: 0 | 1;
  answer_description: string;
};

// 2. クイズデータをコンポーネント内に定義
const QUIZ_POOL: QuizData[] = [
  {
      "id": 1,
      "question": "この展示の名前は？",
      "options": [
          "細野谷記念館",
          "太屋岡記念館"
      ],
      "answerIndex": 0 ,
      "answer_description": "細野谷先生という架空の先生をテーマにした記念館です！"
  },
  {
      "id": 2,
      "question": "今あなたがいる棟は何号館？",
      "options": [
          "4号館",
          "8号館"
      ],
      "answerIndex": 0 ,
      "answer_description": "4号館です！どういう数え方なんだ？"
  },
  {
      "id": 3,
      "question": "北九州高専の校長先生の名前は？",
      "options": [
          "両山校長",
          "片山校長"
      ],
      "answerIndex": 1 ,
      "answer_description": "両山校長...すごい山だなぁ"
  },
  {
      "id": 4,
      "question": "高専祭のビンゴくじ！1日目は何時まで受付してる？",
      "options": [
          "17:00",
          "14:00"
      ],
      "answerIndex": 1,
      "answer_description": "時間は間違えないように！"
  },
  {
      "id": 5,
      "question": "北九州高専の郵便番号はどっち？",
      "options": [
          "802-0985",
          "820-9058"
      ],
      "answerIndex": 0 ,
      "answer_description": "言われてもあんまりピンとこないです"
  },
  {
      "id": 6,
      "question": "北九州高専は何年生で卒業？（専攻科を除く）",
      "options": [
          "3年生",
          "5年生"
      ],
      "answerIndex": 1,
      "answer_description": "最大で10年間過ごせます"
  },
  {
      "id": 7,
      "question": "高専祭のグッズ、Tシャツは何円？",
      "options": [
          "2000円",
          "3500円"
      ],
      "answerIndex": 0 ,
      "answer_description": "やすいです、めちゃくちゃ"
  },
  {
      "id": 8,
      "question": "今年の高専祭のキャッチコピーは？",
      "options": [
          "カルチャー",
          "文化"
      ],
      "answerIndex": 0 ,
      "answer_description": "高専の「文化」を見せつけてやります"
  },
  {
      "id": 9,
      "question": "「I」コースは、何コース？",
      "options": [
          "電気電子コース",
          "情報システムコース"
      ],
      "answerIndex": 1,
      "answer_description": "Infomation"
  },
  {
      "id": 10,
      "question": "製鉄所で鉄を生産する時に発生する、副産物は何？(ヒント：パンフレット39ページ)",
      "options": [
          "スラグ",
          "プラグ"
      ],
      "answerIndex": 0 ,
      "answer_description": "身の回りにヒントは眠ってるんだ"
  },
  {
      "id": 11,
      "question": "2025年の高専祭は、第何回目？",
      "options": [
          "第59回",
          "第61回"
      ],
      "answerIndex": 0 ,
      "answer_description": "今年で高専は60周年です！"
  },
  {
      "id": 12,
      "question": "北九州高専(略してNitKit)は今年で何周年？",
      "options": [
          "60周年",
          "70周年"
      ],
      "answerIndex": 0 ,
      "answer_description": "今年で高専祭は59回目！"
  },
  {
      "id": 13,
      "question": "高専の最寄りのコンビニは？",
      "options": [
          "ローソン",
          "ファミリーマート"
      ],
      "answerIndex": 1,
      "answer_description": "ファミチキが売ってるのでファミマです"
  },
  {
      "id": 14,
      "question": "一年生は一号館の何階で展示をしている？",
      "options": [
          "4階",
          "3階"
      ],
      "answerIndex": 0 ,
      "answer_description": "登るのめっちゃ大変"
  },
  {
      "id": 15,
      "question": "高専祭は何時から始まる？",
      "options": [
          "9:35",
          "9:15"
      ],
      "answerIndex": 1,
      "answer_description": "くいこ〜（915）で覚えてください"
  },
  {
      "id": 16,
      "question": "このすごろくを展示しているのは何コース？",
      "options": [
          "知能ロボットコース",
          "情報システムコース"
      ],
      "answerIndex": 1,
      "answer_description": "情報棟にあるから情報コース...とは限らないんですね"
  },
  {
      "id": 17,
      "question": "今日は「志井公園駅から小倉方面」に、電車で帰ろうかなぁ。16時台の電車は何分にくる？",
      "options": [
          "16:27",
          "16:34"
      ],
      "answerIndex": 1,
      "answer_description": "高専生はみんなこれを把握しています"
  },
  {
      "id": 18,
      "question": "ブラスバンド（吹奏楽部）のステージで演奏される曲は？",
      "options": [
          "宝島",
          "情熱大陸"
      ],
      "answerIndex": 0 ,
      "answer_description": "丁寧、丁寧、丁寧に連れて行きます"
  },
  {
      "id": 19,
      "question": "高専祭の立役者！文化局長の名前はズバリ？",
      "options": [
          "藤本日陰氏",
          "藤本陽向氏"
      ],
      "answerIndex": 1,
      "answer_description": "彼は僕らにとっての太陽です"
  },
  {
      "id": 20,
      "question": "高専祭で開催されるお笑いの大会のタイトルは？",
      "options": [
          "N-1グランプリ",
          "M-1グランプリ"
      ],
      "answerIndex": 0 ,
      "answer_description": "Nit-Kit-No1グランプリです"
  }
];

// 3. Propsの型定義 (currentMoney を含む)
type QuizProps = {
  currentMoney: number;
  onUpdateMoney: (newTotal: number) => void; // 「総額」を渡す
  onClose?: () => void;
}

// 4. コンポーネント本体 (currentMoney を受け取る)
export default function Quiz({ currentMoney, onUpdateMoney, onClose }: QuizProps) {
  const setRouting = useGameStore((s) => s.setRouting)
  const incrementBranch = useGameStore((s) => s.incrementBranch)

  // マウント時にクイズをランダムに1つ選択
  const selectedQuiz = useMemo<QuizData>(() => {
    const randomIndex = Math.floor(Math.random() * QUIZ_POOL.length);
    return QUIZ_POOL[randomIndex]!;
  }, []);

  const [showContent, setShowContent] = useState(false)
  const [, setFinalChoice] = useState<0 | 1 | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false)
  const handledRef = useRef(false)

  const handleAdvance = () => {
    if (!showContent && !resultMessage){
      setShowContent(true);
    } else if (!showContent && resultMessage){
      setRouting(false);
      onClose?.();
    }
  };

  // 5. 選択時の処理 (所持金計算を修正)
  const go = (choiceIndex: 0 | 1) => {
    if (submitting || handledRef.current) return;
    handledRef.current = true
    setSubmitting(true)

    const isCorrect = choiceIndex === selectedQuiz.answerIndex
    
    // 変動額を計算
    const reward = isCorrect ? 5000 : 0; 
    
    const finalMessage = isCorrect
      ? 'クイズに正解したので 5000円獲得！'
      : 'クイズに失敗したので 5000円獲得ならず……';

    // 「変動後の総額」を計算
    const newTotal = currentMoney + reward;
    
    // 「総額」を親コンポーネントに通知
    onUpdateMoney(newTotal);

    setFinalChoice(choiceIndex);
    setResultMessage(finalMessage);
    setShowContent(false);
    incrementBranch()
  }

  const isTitleOnly = !showContent

  return (
    <div className={`absolute z-50 inset-0 ${isTitleOnly ? 'cursor-pointer' : ''}`} onClick={isTitleOnly ? handleAdvance : undefined}>
        {isTitleOnly ? (
          // タイトル / 結果表示
          <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
            <div className="rounded-xl border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
              <p className="font-bold mb-2 text-[#5B7BA6] text-2xl">
                {resultMessage ?? '【クイズマス】'}
              </p>
              {!resultMessage && (
                <p className="text-xl">
                  クイズに正解して5000円をゲットしよう！
                </p>
              )}
            </div>
          </div>
        ) : (
          // クイズ本体 (選択肢)
          <div className='flex justify-center items-center w-full h-full'>
            <div className="rounded-[6] border-2 border-amber-100 bg-white/90 backdrop-blur-sm shadow-lg p-5 w-5/8">
              <p className="font-bold mb-2 text-[#5B7BA6] text-2xl p-5 text-center">
                {selectedQuiz.question}
              </p>
              <div className="flex gap-4 mt-4 justify-center items-center">
                
                {/* 選択肢A (枠全体をクリック可能) */}
                <div
                  role="button"
                  aria-label={selectedQuiz.options[0]}
                  tabIndex={submitting ? -1 : 0}
                  className="rounded-xl border-2 bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-[15%] text-center cursor-pointer"
                  onClick={() => go(0)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go(0)}
                >
                  <span className="font-bold text-white text-2xl">
                    {selectedQuiz.options[0]}
                  </span>
                </div>

                {/* 選択肢B (枠全体をクリック可能) */}
                <div
                  role="button"
                  aria-label={selectedQuiz.options[1]}
                  tabIndex={submitting ? -1 : 0}
                  className="rounded-xl border-2 bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-[15%] text-center cursor-pointer"
                  onClick={() => go(1)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && go(1)}
                >
                  <span className="font-bold text-white text-2xl">
                    {selectedQuiz.options[1]}
                  </span>
                </div>

              </div>
            </div>
          </div>
        )}
      {/* 吹き出しの尻尾 */}
      <div className="relative">
        <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
      </div>
    </div>
  )
}