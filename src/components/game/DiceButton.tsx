import Image from 'next/image'

type DiceButtonProps = {
  className?: string
  onClick?: () => void
  label?: string
}

export default function DiceButton({
  className = '',
  onClick,
  label = 'ふる',
}: DiceButtonProps) {
  return (
    <button
      type="button"
      aria-label="サイコロをふる"
      onClick={onClick}
      className={`grid place-items-center rounded-full aspect-square bg-blue-default text-white shadow-lg ${className}`}
      style={{
        width: 'clamp(80px, 10vw, 300px)',
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative aspect-square md:w-[80px] sm:w-[32px]">
          <Image src="/dice2.png" alt="" fill className="object-contain" />
        </div>
        <div className="text-lg mt-1 leading-none tracking-wide">{label}</div>
      </div>
    </button>
  )
}
