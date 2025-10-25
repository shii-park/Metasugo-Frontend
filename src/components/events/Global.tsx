// 例: components/events/MoneyPlus.tsx
'use client'
export default function MoneyPlus({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute z-50 left-[5%] right-[5%] bottom-[6%]">
      <div className="rounded-xl border-2 border-white/90 bg-white/90 backdrop-blur-sm shadow-lg p-4 md:p-5">
        <p className="font-bold mb-2">【全体効果マス】</p>
        <p className="text-sm md:text-base">
          （ダミー）いまはテキスト表示のみ。OKで閉じます。
        </p>
        <div className="mt-3">
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="absolute right-8 -mt-1 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-white/90 border-r-[10px] border-r-transparent" />
      </div>
    </div>
  )
}
