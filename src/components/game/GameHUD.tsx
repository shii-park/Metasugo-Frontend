type Props = {
  money: number | string
  remaining: number | string
  className?: string
}

export default function GameHUD({ money, remaining, className = '' }: Props) {
  const moneyText = typeof money === 'number' ? money.toLocaleString() : money

  const isNumber = typeof remaining === 'number'
  const remainingText = isNumber ? String(remaining) : String(remaining)

  return (
    <div className={`flex items-start gap-6 ${className}`}>
      <MoneyPill>{moneyText}円</MoneyPill>

      <RemainingLabel>
        ゴールまで{' '}
        {isNumber ? (
          <span className='tabular-nums'>{remainingText}</span>
        ) : (
          <>
            <Circle /> <Circle />
            <span className='sr-only'>未定</span>
          </>
        )}{' '}
        マス
      </RemainingLabel>
    </div>
  )
}

function MoneyPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        'w-1/3',
        'rounded-xl',
        'border-2 border-blue-default',
        'bg-white/95 backdrop-blur',
        'px-6 py-2',
        'shadow-sm',
        'text-blue-default',
        'font-bold',
        'text-[1.7vw] leading-none',
        'tabular-nums',
      ].join(' ')}
      aria-live='polite'
    >
      現在の所持金：{children}
    </div>
  )
}

function RemainingLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        'relative',
        'text-white',
        'font-bold',
        'text-[clamp(16px,2vw,24px)] leading-tight',
        'pb-1',
        'pt-1',
        "after:content-[''] after:absolute after:left-0 after:right-0",
        'after:-bottom-0.5 after:h-[4px]',
        'after:bg-white/80',
        'whitespace-nowrap',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function Circle() {
  return (
    <span
      aria-hidden
      className={[
        'inline-block align-baseline',
        'w-[1.4em] h-[1.4em]',
        'rounded-full',
        'border-[4px] border-blue-default',
        'mx-1 translate-y-[0.08em]',
        'bg-white/0',
      ].join(' ')}
    />
  )
}
