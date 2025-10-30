'use client'

import { useGameStore } from '@/lib/game/store';
import jsQR from 'jsqr';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';


type Choice = 'a' | 'b'
type BranchProps = { onClose?: () => void }

const PAGE_COPY: Record<number, { title: string; message: string; ans: string[]}> = {
 1: { title: '【条件分岐マス：1ページ目】',
      message: '教員になったから働き方は考えないとな、何を使おう',
      ans: ['AI', 'パソコン']},
 2: { title: '【条件分岐マス：2ページ目】',
      message: '学会で出会った人と意気投合、何度も議論を交わす内にいい雰囲気に...!?どうプロポーズしよう',
      ans: ['花', '指輪']},
 3: { title: '【条件分岐マス：3ページ目】',
      message: 'コース長になってほしいと頼まれた!だけど毎日授業や研究で忙しいなぁ…どうしよう',
      ans: ['花', '指輪']},
}

function getCurrentPageFromPath(pathname: string): number {
 const m = pathname.match(/\/game\/(\d+)\/[ab](?:\/)?$/)
 if (m && m[1]) {
  const n = Number(m[1])
  return Number.isFinite(n) && n >= 1 ? n : 1
 }
 // 末尾にクエリ/ハッシュがある場合の保険
 const path = pathname.split('?')[0]!.split('#')[0]!
 const m2 = path.match(/\/game\/(\d+)\/[ab](?:\/)?$/)
 if (m2 && m2[1]) {
  const n = Number(m2[1])
  return Number.isFinite(n) && n >= 1 ? n : 1
 }  return 1
}

export default function Branch({ onClose }: BranchProps) {
 const router = useRouter()
 const pathname = usePathname()


  const setRouting = useGameStore((s) => s.setRouting);
  const incrementBranch = useGameStore((s) => s.incrementBranch);

 const currentPage = useMemo<number>(() => getCurrentPageFromPath(pathname), [pathname])
 const nextPage = useMemo<number>(() => currentPage + 1, [currentPage])

 const [showContent, setShowContent] = useState(false)
 const [finalChoice, setFinalChoice] = useState<Choice | null>(null);
 const [resultMessage, setResultMessage] = useState<string | null>(null);

 const [isCameraActive, setIsCameraActive] = useState(false);
 const videoRef = useRef<HTMLVideoElement>(null);
 const canvasRef = useRef<HTMLCanvasElement>(null);

 const stopCamera = () => {
  if (videoRef.current && videoRef.current.srcObject) {
   const stream = videoRef.current.srcObject as MediaStream;
   stream.getTracks().forEach(track => track.stop());
  }
};

  const handleCodeDetection = (data: string) => {
    // 検出後のカメラ停止ロジック
    stopCamera();
    setIsCameraActive(false);

    const correctAnswwers = PAGE_COPY[currentPage]?.ans;
    const isCorrect = correctAnswwers?.some(ans => ans.toLowerCase() === data.toLocaleLowerCase()) ?? false;

    const finalChoice: Choice = isCorrect ? 'a' : 'b';


    const finalMessage = isCorrect
        ? `QRコード「${data}」を読み取りました。正解です！`
        : `QRコード「${data}」を読み取りました。不正解です。`;

    setFinalChoice(finalChoice);
    setResultMessage(finalMessage);
    setShowContent(false);
    handledRef.current = true;
    setSubmitting(false);
  };

 // QRコードスキャンロジック（モック）
 const scanQR = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas || video.readyState <2){
    if (isCameraActive) requestAnimationFrame(scanQR);
    return;
  }

  const ctx =canvas.getContext('2d');
  if (!ctx) {
    if (isCameraActive) requestAnimationFrame(scanQR);
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.drawImage(video, 0, 0, canvas.width,canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (code) {
    handleCodeDetection(code.data);
  } else if (isCameraActive) {
    requestAnimationFrame(scanQR);
  }
 };

 useEffect(() => {
  void router.prefetch(`/game/${nextPage}/a`)
  void router.prefetch(`/game/${nextPage}/b`)
}, [router, nextPage])

 // カメラ起動処理
 useEffect(() => {
  if (isCameraActive) {
   navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
     if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      videoRef.current.onloadedmetadata = () => {
        requestAnimationFrame(scanQR);
        };
     }
    })
    .catch(err => {
     console.error("カメラアクセス失敗:", err);
     alert("カメラにアクセスできませんでした。権限を確認してください。");
     setIsCameraActive(false);
    });
  } else {
   stopCamera();
  }
 }, [isCameraActive]);

 const copy = PAGE_COPY[currentPage] ?? {
  title: `【条件分岐マス：${currentPage}ページ目】`,
  message: 'AかBを選んで次のページへ進みます。',
 }

 const [submitting, setSubmitting] = useState(false)
 const handledRef = useRef(false)

 const handleAdvance = () => {
  if (!showContent && !resultMessage){
   setShowContent(true);
  }else if (!showContent && resultMessage){
   setRouting(true);
   onClose?.();
   if(finalChoice){
    router.push(`/game/${nextPage}/${finalChoice}`);
   }else{
    router.push(`/game/${nextPage}/a`);
     }
  }
 };

  // スキャナーを開く（QRコードボタンの onClick）
 const handleOpenScanner = () => {
  if (submitting || handledRef.current) return;
    handledRef.current = true;
  setIsCameraActive(true);
 }

 const go = (choice: Choice) => {
  if (choice === 'b') {
   if (submitting || handledRef.current) return;
   handledRef.current = true;
   setSubmitting(true);

   const finalMessage = 'スキップしました';
   setResultMessage(finalMessage);
   setShowContent(false);

   incrementBranch();
  }
 }

 const isTitleOnly = !showContent

  return (
    <div className='absolute z-50 inset-0 cursor-pointer' onClick={isTitleOnly ? handleAdvance : undefined}>
        {isTitleOnly ? (
          <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
          <div className="rounded-xl border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
            <p className="font-bold mb-2 text-[#5B7BA6] text-2xl">{resultMessage ?? copy.title}</p>
          </div>
          </div>
        ) : (
          <div className='flex justify-center items-center w-full h-full'>
            <div className="rounded-[6] border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-5 w-5/8">
              <p className="font-bold mb-2 text-[#5B7BA6] text-2xl p-5 text-center">
                選択肢を教室内から探し出そう
              </p>
              <div className="rounded-xl border-2  bg-[#ccb173] backdrop-blur-sm shadow-lg md:p-5  text-center">
                <button
                  type="button"
                  className="flex font-bold mb-2 text-white text-2xl w-full items-center justify-center"
                  onClick={() => go('a')}
                  aria-label="A で次ページへ進む"
                  disabled={submitting}
                >
                  <img
                    src="/QR_example.svg"
                    alt="QRコード"
                    className=" pr-[8%]"
                  />
                  QRコードを読み取る
                </button>
              </div>
              <div className="rounded-xl border-2  bg-[#ccb173] backdrop-blur-sm shadow-lg p-5  text-center">
                <button
                  type="button"
                  className="font-bold mb-2 text-white text-2xl"
                  onClick={() => go('b')}
                  aria-label="B で次ページへ進む"
                  disabled={submitting}
                >
                  スキップする
                </button>
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
