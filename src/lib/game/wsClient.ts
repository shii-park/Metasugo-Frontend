'use client'

/**
 * WebSocketクライアント (フロント側)
 *
 * - NEXT_PUBLIC_WS_URL でサーバー (例: ws://localhost:8080/ws/connection)
 * - 認証は URL の ?token=... で付与
 * - 自動再接続 / ハートビート / 送信キュー付き
 */

/* ============================
 * サーバー -> クライアント メッセージ型
 * ============================
 */

/** DICE_RESULT */
export type DiceResultPayload = {
  userID: string
  diceResult: number
}
export type DiceResultMessage = {
  type: 'DICE_RESULT'
  payload: DiceResultPayload
}

/** PLAYER_MOVED */
export type PlayerMovedPayload = {
  userID: string
  newPosition: number
}
export type PlayerMovedMessage = {
  type: 'PLAYER_MOVED'
  payload: PlayerMovedPayload
}

/** MONEY_CHANGED */
export type MoneyChangedPayload = {
  userID: string
  newMoney: number
}
export type MoneyChangedMessage = {
  type: 'MONEY_CHANGED'
  payload: MoneyChangedPayload
}

/** BRANCH_CHOICE_REQUIRED */
export type BranchChoiceRequiredPayload = {
  tileID: number
  options: number[]
}
export type BranchChoiceRequiredMessage = {
  type: 'BRANCH_CHOICE_REQUIRED'
  payload: BranchChoiceRequiredPayload
}

/** QUIZ_REQUIRED */
export type QuizRequiredPayload = {
  tileID: number
  quizData: {
    id: number
    question: string
    options: string[]
    answer_description: string
  }
}
export type QuizRequiredMessage = {
  type: 'QUIZ_REQUIRED'
  payload: QuizRequiredPayload
}

/** GAMBLE_REQUIRED */
export type GambleRequiredPayload = {
  tileID: number
  referenceValue: number
}
export type GambleRequiredMessage = {
  type: 'GAMBLE_REQUIRED'
  payload: GambleRequiredPayload
}

/** GAMBLE_RESULT */
export type GambleResultPayload = {
  userID: string
  diceResult: number
  choice: 'High' | 'Low'
  won: boolean
  amount: number
  newMoney: number
}
export type GambleResultMessage = {
  type: 'GAMBLE_RESULT'
  payload: GambleResultPayload
}

/** PLAYER_FINISHED */
export type PlayerFinishedPayload = {
  userID: string
  money: number
}
export type PlayerFinishedMessage = {
  type: 'PLAYER_FINISHED'
  payload: PlayerFinishedPayload
}

/** PLAYER_STATUS_CHANGED */
export type PlayerStatusChangedPayload = {
  userID: string
  status: string
  value: boolean | string | number | null
}
export type PlayerStatusChangedMessage = {
  type: 'PLAYER_STATUS_CHANGED'
  payload: PlayerStatusChangedPayload
}

/** NEIGHBOR_REQUIRED */
export type NeighborRequiredPayload = {
  tileID: number;
  message: string;
};
export type NeighborRequiredMessage = {
  type: "NEIGHBOR_REQUIRED";
  payload: NeighborRequiredPayload;
};

/** ERROR */
export type ErrorPayload = {
  message: string
}
export type ErrorMessage = {
  type: 'ERROR'
  payload: ErrorPayload
}

/** 汎用 */
export type QuizData = QuizRequiredPayload['quizData']
export type GambleChoice = 'High' | 'Low'

/** サーバーから届きうる全てのメッセージ */
export type ServerMessage =
  | DiceResultMessage
  | PlayerMovedMessage
  | MoneyChangedMessage
  | BranchChoiceRequiredMessage
  | QuizRequiredMessage
  | GambleRequiredMessage
  | GambleResultMessage
  | PlayerFinishedMessage
  | PlayerStatusChangedMessage
  | NeighborRequiredMessage
  | ErrorMessage
  | { type: 'PONG' } // ハートビート応答
  | { type: string; [k: string]: unknown } // 将来拡張用

/* ============================
 * クライアント -> サーバー メッセージ型
 * ============================
 */

export type RollDiceMessage = {
  type: 'ROLL_DICE'
  payload: Record<string, never>
}

export type SubmitChoiceMessage = {
  type: 'SUBMIT_CHOICE'
  payload: { selection: number }
}

export type SubmitQuizMessage = {
  type: 'SUBMIT_QUIZ'
  payload: { selection: number }
}

export type SubmitGambleMessage = {
  type: 'SUBMIT_GAMBLE'
  payload: { bet: number; choice: 'High' | 'Low' }
}

export type OutgoingClientMessage =
  | RollDiceMessage
  | SubmitChoiceMessage
  | SubmitQuizMessage
  | SubmitGambleMessage

/* ============================
 * ハンドラ（全部オプショナル）
 * ============================
 */
export type GameSocketHandlers = {
  onOpen?: () => void
  onClose?: (ev: CloseEvent) => void
  onError?: (ev: Event) => void

  onDiceResult?: (userID: string, diceResult: number) => void
  onPlayerMoved?: (userID: string, newPosition: number) => void
  onMoneyChanged?: (userID: string, newMoney: number) => void
  onBranchChoiceRequired?: (tileID: number, options: number[]) => void
  onQuizRequired?: (tileID: number, quizData: QuizRequiredPayload['quizData']) => void
  onGambleRequired?: (tileID: number, referenceValue: number) => void
  onGambleResult?: (
    userID: string,
    diceResult: number,
    choice: 'High' | 'Low',
    won: boolean,
    amount: number,
    newMoney: number
  ) => void;

  onNeighborRequired?: (tileID: number, message: string) => void;
  onPlayerFinished?: (userID: string, money: number) => void
  onPlayerStatusChanged?: (userID: string, status: string, value: boolean | string | number | null) => void
  onErrorMessage?: (message: string) => void
}

/* ============================
 * 呼び出し元が使うインターフェース
 * ============================
 */
export type GameSocketConnection = {
  sendRollDice: () => void
  sendSubmitChoice: (selection: number) => void
  sendSubmitQuiz: (selection: number) => void
  sendSubmitGamble: (bet: number, choice: 'High' | 'Low') => void
  close: () => void
}

/* ============================
 * アクティブ接続の取得API
 * ============================
 */
let _activeSocket: GameSocketConnection | null = null
export function getActiveSocket(): GameSocketConnection | null {
  return _activeSocket
}

/* ============================
 * ユーティリティ
 * ============================
 */
function encodeUrlWithToken(base: string, token: string): string {
  try {
    const u = new URL(base)
    u.searchParams.set('token', token)
    return u.toString()
  } catch {
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}token=${encodeURIComponent(token)}`
  }
}

/** payload あり/なし、snake/camel 混在に耐える取り出し */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPayload<T extends object = any>(msg: unknown): Partial<T> {
  if (!msg || typeof msg !== 'object') return {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyMsg = msg as any
  const p = anyMsg.payload ?? anyMsg

  // snake -> camel 柔軟対応
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(p)) {
    const v = p[k]
    if (k.includes('_')) {
      const camel = k.replace(/_([a-z])/g, (_m: string, s: string) => s.toUpperCase())
      out[camel] = v
    }
    out[k] = v
  }
  return out as Partial<T>
}

/* ============================
 * WebSocket 接続本体
 * ============================
 */

/**
 * WebSocket 接続 (認証トークン必須)
 * @param handlers ハンドラ群
 * @param token Firebase IDトークン（必須）
 */
export function connectGameSocket(
  handlers: GameSocketHandlers,
  token: string | null,
): GameSocketConnection {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL ?? ''
  if (!baseUrl) {
    console.error('[WS] NEXT_PUBLIC_WS_URL が未設定です')
    return makeDummyConnection()
  }
  if (!token) {
    console.error('[WS] 認証トークンがありません。接続を中止します。')
    return makeDummyConnection()
  }

  const url = encodeUrlWithToken(baseUrl, token)

  let ws: WebSocket | null = null
  let isOpen = false
  let manualClosed = false

  // 送信キュー（OPEN まで貯める）
  const queue: OutgoingClientMessage[] = []

  // 自動再接続（指数バックオフ）
  let retry = 0
  const MIN_MS = 500
  const MAX_MS = 10_000

  // ハートビート
  let pingTimer: ReturnType<typeof setInterval> | null = null
  const PING_INTERVAL = 25_000
  const startPing = () => {
    stopPing()
    pingTimer = setInterval(() => {
      try {
        ws?.send(JSON.stringify({ type: 'PING', payload: {} }))
      } catch { /* noop */ }
    }, PING_INTERVAL)
  }
  const stopPing = () => {
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
  }

  const open = () => {
    // 接続
    console.log('[WS] 接続試行: ', `${baseUrl}?token=...`)
    ws = new WebSocket(url)

    ws.onopen = () => {
      isOpen = true
      retry = 0
      handlers.onOpen?.()
      startPing()
      // 溜まっていたメッセージを送信
      for (const m of queue.splice(0)) {
        ws?.send(JSON.stringify(m))
      }
    }

    ws.onerror = (ev: Event) => {
      handlers.onError?.(ev)
    }

    ws.onclose = (ev: CloseEvent) => {
      isOpen = false
      stopPing()
      handlers.onClose?.(ev)

      // 手動 close 以外は自動再接続
      if (!manualClosed) {
        retry += 1
        const wait = Math.min(MAX_MS, MIN_MS * Math.pow(2, retry)) + Math.floor(Math.random() * 300)
        setTimeout(() => {
          if (!manualClosed) open()
        }, wait)
      }
    }

    ws.onmessage = (ev: MessageEvent<string>) => {
      let parsed: ServerMessage
      try {
        parsed = JSON.parse(ev.data) as ServerMessage
      } catch {
        console.error('[WS] invalid JSON:', ev.data)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const type = (parsed as any)?.type as string
      if (!type) return

      switch (type) {
        case 'PONG':
          // ハートビート応答
          return

        case 'DICE_RESULT': {
          const p = getPayload<DiceResultPayload>(parsed)
          if (p.userID != null && p.diceResult != null) {
            handlers.onDiceResult?.(String(p.userID), Number(p.diceResult))
          }
          return
        }

        case 'PLAYER_MOVED': {
          const p = getPayload<PlayerMovedPayload>(parsed)
          if (p.userID != null && p.newPosition != null) {
            handlers.onPlayerMoved?.(String(p.userID), Number(p.newPosition))
          }
          return
        }

        case 'MONEY_CHANGED': {
          const p = getPayload<MoneyChangedPayload>(parsed)
          if (p.userID != null && p.newMoney != null) {
            handlers.onMoneyChanged?.(String(p.userID), Number(p.newMoney))
          }
          return
        }

        case 'BRANCH_CHOICE_REQUIRED': {
          const p = getPayload<BranchChoiceRequiredPayload>(parsed)
          if (p.tileID != null && Array.isArray(p.options)) {
            handlers.onBranchChoiceRequired?.(Number(p.tileID), p.options.map(Number))
          }
          return
        }

        case 'QUIZ_REQUIRED': {
          const p = getPayload<QuizRequiredPayload>(parsed)
          if (p.tileID != null && p.quizData) {
            handlers.onQuizRequired?.(Number(p.tileID), p.quizData)
          }
          return
        }

        case 'GAMBLE_REQUIRED': {
          const p = getPayload<GambleRequiredPayload>(parsed)
          if (p.tileID != null && p.referenceValue != null) {
            handlers.onGambleRequired?.(Number(p.tileID), Number(p.referenceValue))
          }
          return
        }

        case 'GAMBLE_RESULT': {
          const p = getPayload<GambleResultPayload>(parsed)
          if (p.userID != null && p.diceResult != null && p.choice && p.won != null && p.amount != null && p.newMoney != null) {
            handlers.onGambleResult?.(
              String(p.userID),
              Number(p.diceResult),
              p.choice as 'High' | 'Low',
              Boolean(p.won),
              Number(p.amount),
              Number(p.newMoney),
            )
          }
          return
        }

        case 'PLAYER_FINISHED': {
          const p = getPayload<PlayerFinishedPayload>(parsed)
          if (p.userID != null && p.money != null) {
            handlers.onPlayerFinished?.(String(p.userID), Number(p.money))
          }
          return
        }

        case 'PLAYER_STATUS_CHANGED': {
          const p = getPayload<PlayerStatusChangedPayload>(parsed)
          if (p.userID != null && p.status != null) {
            handlers.onPlayerStatusChanged?.(String(p.userID), String(p.status), p.value ?? null)
          }
          return
        }

        case 'ERROR': {
          const p = getPayload<ErrorPayload>(parsed)
          if (p.message) handlers.onErrorMessage?.(String(p.message))
          return
        }

        default:
          // 未知メッセージは無視（必要ならログ）
          // console.debug('[WS] unknown message:', parsed)
          return
      }
    }
  }

  // 初回接続
  open()

  // 送信（OPENでなければキューへ）
  const rawSend = (msg: OutgoingClientMessage) => {
    if (isOpen && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    } else {
      queue.push(msg)
    }
  }

  const connection: GameSocketConnection = {
    sendRollDice() {
      rawSend({ type: 'ROLL_DICE', payload: {} })
    },
    sendSubmitChoice(selection: number) {
      rawSend({ type: 'SUBMIT_CHOICE', payload: { selection } })
    },
    sendSubmitQuiz(selection: number) {
      rawSend({ type: 'SUBMIT_QUIZ', payload: { selection } })
    },
    sendSubmitGamble(bet: number, choice: 'High' | 'Low') {
      rawSend({ type: 'SUBMIT_GAMBLE', payload: { bet, choice } })
    },
    close() {
      manualClosed = true
      stopPing()
      try {
        ws?.close()
      } catch { /* noop */ }
      ws = null
      if (_activeSocket === connection) _activeSocket = null
    },
  }

  _activeSocket = connection
  return connection
}

/* =========== ダミー =========== */
function makeDummyConnection(): GameSocketConnection {
  const warn = (m: string) => () => console.error(`WS未接続: ${m}`)
  return {
    sendRollDice: warn('sendRollDice'),
    sendSubmitChoice: warn('sendSubmitChoice'),
    sendSubmitQuiz: warn('sendSubmitQuiz'),
    sendSubmitGamble: warn('sendSubmitGamble'),
    close: () => {},
  }
}
