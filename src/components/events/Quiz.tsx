'use client'

import { useGameStore } from '@/lib/game/store' // ※ストアは引き続き使用
import { useMemo, useRef, useState } from 'react'

type Choice = 'a' | 'b'

// 1. クイズのデータ型を定義
type QuizData = {
  question: string;  // 質問文
  choiceA: string;   // 選択肢A
  choiceB: string;   // 選択肢B
  correct: Choice; // 正解 ('a' or 'b')
};

// 2. クイズの質問プール (Notionから取得するまでの仮データ)
// 将来的にNotion APIからこの配列を取得・生成するように変更してください。
const QUIZ_POOL: QuizData[] = [
  {
    question: 'よしくんの苗字は？',
    choiceA: '吉元',
    choiceB: '吉本',
    correct: 'a',
  },
  {
    question: '日本の首都は？',
    choiceA: '大阪',
    choiceB: '東京',
    correct: 'b',
  },
  {
    question: '1 + 1 = ?',
    choiceA: '2',
    choiceB: '3',
    correct: 'a',
  },
  // ... ここにNotionから取得したクイズを追加 ...
];

// 3. コンポーネントのPropsを更新 (onUpdateMoney を追加)
type QuizProps = {
  onUpdateMoney: (amount: number) => void; // お金の更新を親に通知
  onClose?: () => void;                  // 閉じる処理用
}

/**
 * ランダムな2択クイズを表示するコンポーネント
 * 1. クリックでクイズ内容を表示
 * 2. 回答を選択
 * 3. 結果を表示 (正解: +5000, 不正解: +0)
 * 4. クリックで onClose を呼び出して閉じる
 */
export default function Quiz({ onUpdateMoney, onClose }: QuizProps) {
  // 4. routerやpathname関連のフックを削除 (コンポーネントの再利用性向上のため)
  // const router = useRouter()
  // const pathname = usePathname()

  const setRouting = useGameStore((s) => s.setRouting)
  const incrementBranch = useGameStore((s) => s.incrementBranch)

  // 5. マウント時にクイズをランダムに1つ選択
  const selectedQuiz = useMemo<QuizData>(() => {
    const randomIndex = Math.floor(Math.random() * QUIZ_POOL.length);
    // QUIZ_POOLが空でない限り ! は安全です
    return QUIZ_POOL[randomIndex]!;
  }, []); // 空の配列でマウント時に1回だけ実行

  const [showContent, setShowContent] = useState(false)
  const [, setFinalChoice] = useState<Choice | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // 6. prefetchやcurrentPageなどのロジックを削除

  const [submitting, setSubmitting] = useState(false)
  const handledRef = useRef(false)

  const handleAdvance = () => {
    if (!showContent && !resultMessage){
      setShowContent(true);
    } else if (!showContent && resultMessage){
      setRouting(false);
      onClose?.(); // 変更なし (onCloseを呼ぶ)
    }
  };

  const go = (choice: Choice) => {
    if (submitting || handledRef.current) return
    handledRef.current = true
    setSubmitting(true)

    // 7. 正解判定をランダムに選んだクイズ (selectedQuiz) を使うように変更
    const isCorrect = choice === selectedQuiz.correct

    // 8. 要件（画像）に合わせてメッセージと報酬ロジックを定義
    let finalMessage: string;
    let reward: number;

    if (isCorrect) {
      finalMessage = 'クイズに正解したので 5000円獲得！'; // image_01a77f.png
      reward = 5000;
    } else {
      finalMessage = 'クイズに失敗したので 5000円獲得ならず……'; // image_01a7a1.png
      reward = 0; // 没収なし
    }
    
    // 9. 親コンポーネントにお金の変動を通知
    onUpdateMoney(reward);

    setFinalChoice(choice);
    setResultMessage(finalMessage);
    setShowContent(false);

    incrementBranch()
  }

  const isTitleOnly = !showContent

  return (
    <div className={`absolute z-50 inset-0 ${isTitleOnly ? 'cursor-pointer' : ''}`} onClick={isTitleOnly ? handleAdvance : undefined}>
        {isTitleOnly ? (
          // 10. 画像 (image_01a73d.png) に合わせてUIを2行表示に変更
          <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
          <div className="rounded-xl border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
            <p className="font-bold mb-2 text-[#5B7BA6] text-2xl">
              {resultMessage ?? '【クイズマス】'}
            </p>
            {/* 結果表示中はメッセージを隠す */}
            {!resultMessage && (
              <p className="text-xl">
                クイズに正解して5000円をゲットしよう！
              </p>
            )}
          </div>
          </div>
        ) : (
          // 11. クイズ内容を selectedQuiz の内容で動的に変更
          <div className='flex justify-center items-center w-full h-full'>
            <div className="rounded-[6] border-2 border-amber-100 bg-white/90 backdrop-blur-sm shadow-lg p-5 w-5/8">
              <p className="font-bold mb-2 text-[#5B7BA6] text-2xl p-5 text-center">
                {selectedQuiz.question} {/* 質問文 */}
              </p>
              <div className="flex gap-4 mt-4 justify-center items-center">
                
                {/* 選択肢 A */}
                <div className="rounded-xl border-2  bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-[15%] text-center">
                  <button
                    type="button"
                    className="flex font-bold mb-2 text-white text-2xl w-full items-center justify-center"
                    onClick={() => go('a')}
                    aria-label="A を選択"
                    disabled={submitting}
                  >
                    {selectedQuiz.choiceA} {/* 選択肢A */}
                  </button>
                </div>

                {/* 選択肢 B */}
                <div className="rounded-xl border-2  bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-[15%]  text-center">
                  <button
                    type="button"
                    className="font-bold mb-2 text-white text-2xl"
                    onClick={() => go('b')}
                    aria-label="B を選択"
                    disabled={submitting}
                  >
                    {selectedQuiz.choiceB} {/* 選択肢B */}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      <div className="relative">
        <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
      </div>
    </div>
  )
}