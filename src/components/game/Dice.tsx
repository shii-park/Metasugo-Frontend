import Image from 'next/image';

// サイコロボタン（見た目だけ・クリックで onRoll を呼ぶ）
export default function DiceButton({
  className = '',
  onRoll,
  label = 'ふる',
}: {
  className?: string
  onRoll?: () => void
  label?: string
}) {
  return (
  <button
    type="button"
    aria-label="サイコロをふる"
    onClick={onRoll}
    className={`grid place-items-center rounded-full aspect-square bg-blue-default text-white shadow-lg ${className}`}
    style={{
      width: "clamp(80px, 10vw, 300px)",
    }}
  >
    <div className="flex flex-col items-center justify-center">
      <Image
        src="/dice2.png"
        alt=""
        width={80}
        height={80}
        className="w-3/4 h-auto object-contain"
      />
      <div className="text-lg mt-1 leading-none tracking-wide">{label}</div>
    </div>
  </button>
);
}
