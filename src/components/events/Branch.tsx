'use client'

import { useGameStore } from '@/lib/game/store'
import { getActiveSocket } from '@/lib/game/wsClient'
import jsQR from 'jsqr'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type Choice = 'a' | 'b'
type BranchProps = {
  onClose?: () => void
  /** Game1 から渡される分岐タイル [A,B]。未指定なら WS 送信はスキップ */
  options?: [number, number] | null
}

const PAGE_COPY: Record<number, { title: string; message: string; ans: string[] }> = {
  1: {
    title: '【条件分岐マス：1ページ目】',
    message: '教員になったから働き方は考えないとな、何を使おう',
    ans: ['AI', 'パソコン'],
  },
  2: {
    title: '【条件分岐マス：2ページ目】',
    message:
      '学会で出会った人と意気投合、何度も議論を交わす内にいい雰囲気に...!?どうプロポーズしよう',
    ans: ['花', '指輪'],
  },
  3: {
    title: '【条件分岐マス：3ページ目】',
    message:
      'コース長になってほしいと頼まれた!だけど毎日授業や研究で忙しいなぁ…どうしよう',
    ans: ['部下', 'お金'],
  },
}

function getCurrentPageFromPath(pathname: string): number {
  const m = pathname.match(/\/game\/(\d+)\/[ab](?:\/)?$/)
  if (m?.[1]) return Number(m[1])
  const path = pathname.split('?')[0]!.split('#')[0]!
  const m2 = path.match(/\/game\/(\d+)\/[ab](?:\/)?$/)
  if (m2?.[1]) return Number(m2[1])
  return 1
}

export default function Branch({ onClose, options }: BranchProps) {
  const router = useRouter()
  const pathname = usePathname()

  const setRouting = useGameStore((s) => s.setRouting)
  const incrementBranch = useGameStore((s) => s.incrementBranch)

  const currentPage = useMemo(() => getCurrentPageFromPath(pathname), [pathname])
  const nextPage = currentPage + 1

  const [showContent, setShowContent] = useState(false)
  const [finalChoice, setFinalChoice] = useState<Choice | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handledRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  // ---- カメラ停止 ----
  const stopCamera = () => {
    const v = videoRef.current
    const stream = v?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (v) v.srcObject = null
    setIsCameraActive(false)
  }

  // ---- QRコード検出 ----
  const handleCodeDetection = (data: string) => {
    stopCamera()

    const correct = PAGE_COPY[currentPage]?.ans ?? []
    const isCorrect = correct.some((ans) => ans.toLowerCase() === data.toLowerCase())
    const choice: Choice = isCorrect ? 'a' : 'b'

    setFinalChoice(choice)
    setResultMessage(
      isCorrect
        ? `QRコード「${data}」を読み取りました。正解です！`
        : `QRコード「${data}」を読み取りました。不正解です。`,
    )
    setShowContent(false)
    handledRef.current = true
    setSubmitting(false)

    // 既存の WS 接続に分岐結果を送信（options があれば）
    if (options) {
      const selectedTile = choice === 'a' ? options[0] : options[1]
      getActiveSocket()?.sendSubmitChoice(selectedTile)
    }

    // 2秒後に遷移
    setTimeout(() => {
      setRouting(true)
      onClose?.()
      router.push(`/game/${nextPage}/${choice}`)
    }, 2000)
  }

  // ---- QRスキャン ----
  const scanQR = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) {
      if (isCameraActive) requestAnimationFrame(scanQR)
      return
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      if (isCameraActive) requestAnimationFrame(scanQR)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) handleCodeDetection(code.data)
    else if (isCameraActive) requestAnimationFrame(scanQR)
  }

  // ---- カメラ起動 ----
  useEffect(() => {
    if (!isCameraActive) return
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        const v = videoRef.current
        if (!v) return
        v.srcObject = stream
        v.play()
        v.onloadedmetadata = () => requestAnimationFrame(scanQR)
      })
      .catch((err) => {
        console.error('カメラアクセス失敗:', err)
        alert('カメラにアクセスできませんでした。権限を確認してください。')
        setIsCameraActive(false)
      })

    // アンマウント/停止時は必ずクリーンアップ
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive])

  const copy = PAGE_COPY[currentPage] ?? {
    title: `【条件分岐マス：${currentPage}ページ目】`,
    message: 'AかBを選んで次のページへ進みます。',
    ans: [],
  }

  const handleAdvance = () => {
    if (!showContent && !resultMessage) setShowContent(true)
  }

  const go = (choice: Choice) => {
    if (submitting || handledRef.current) return
    handledRef.current = true
    setSubmitting(true)

    if (choice === 'b') {
      setResultMessage('スキップしました')
      setShowContent(false)
      incrementBranch()

      if (options) {
        getActiveSocket()?.sendSubmitChoice(options[1])
      }

      setTimeout(() => {
        setRouting(true)
        onClose?.()
        router.push(`/game/${nextPage}/b`)
      }, 1000)
    } else {
      setIsCameraActive(true) // ユーザー操作でカメラ起動
    }
  }

  const isTitleOnly = !showContent

  return (
    <div
      className="absolute z-50 inset-0 cursor-pointer"
      onClick={isTitleOnly ? handleAdvance : undefined}
    >
      {/* タイトル表示 */}
      {isTitleOnly ? (
        <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
          <div className="rounded-xl border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
            <p className="font-bold mb-2 text-[#5B7BA6] text-2xl">
              {resultMessage ?? copy.title}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center w-full h-full">
          {/* 選択肢ボックス */}
          <div className="rounded-[6] border-2 border-black/90 bg-white/90 backdrop-blur-sm shadow-lg p-5 w-5/8 text-center">
            <p className="font-bold mb-2 text-[#5B7BA6] text-2xl">選択肢を教室内から探し出そう</p>
            <div className="flex flex-col space-y-3">
              <button
                className="flex font-bold text-white text-2xl justify-center items-center bg-[#ccb173] rounded-xl p-4"
                onClick={() => go('a')}
                disabled={submitting}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/QR_example.svg" alt="QRコード" className="pr-3" />
                QRコードを読み取る
              </button>
              <button
                className="font-bold text-white text-2xl bg-[#ccb173] rounded-xl p-4"
                onClick={() => go('b')}
                disabled={submitting}
              >
                スキップする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カメラプレビュー */}
      {isCameraActive && (
        <div className="absolute inset-0 flex justify-center items-center z-50">
          <video
            ref={videoRef}
            className="w-[70%] max-w-md aspect-video object-cover rounded-xl border-2 border-black shadow-lg"
            autoPlay
            muted
            playsInline
          />
          <button
            onClick={stopCamera}
            className="absolute top-5 right-5 text-white font-bold bg-red-500 rounded-full w-10 h-10 flex justify-center items-center text-2xl"
            aria-label="カメラ閉じる"
          >
            ×
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
