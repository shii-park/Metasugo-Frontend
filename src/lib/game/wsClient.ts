'use client'

/**
 * WebSocketクライアント (フロント側)
 *
 * - NEXT_PUBLIC_WS_URL でサーバー (例: ws://localhost:8080/ws)
 * - ★ 認証トークンあり版 ★
 *
 * 送受信するメッセージは、仕様書のJSONフォーマットに合わせて型定義している。
 * any / unknown は使わない。ハンドラは全部オプショナルなので必要なものだけ渡せばOK。
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
  newPosition: number // サーバーが正とするタイルID
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
  options: number[] // 進める候補タイルID
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
  referenceValue: number // High/Low の基準
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
  status: string // "isMarried" | "hasChildren" | "job" など
  value: boolean | string | number | null
}
export type PlayerStatusChangedMessage = {
  type: 'PLAYER_STATUS_CHANGED'
  payload: PlayerStatusChangedPayload
}

/** ERROR */
export type ErrorPayload = {
  message: string
}
export type ErrorMessage = {
  type: 'ERROR'
  payload: ErrorPayload
}

export type QuizData = QuizRequiredPayload['quizData']
export type GambleChoice = 'High' | 'Low'

/**
 * サーバーから届きうる全てのメッセージ
 * (discriminated union)
 */
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
  | ErrorMessage

/* ============================
 * クライアント -> サーバー メッセージ型
 * ============================
 */

/** ROLL_DICE */
export type RollDiceMessage = {
  type: 'ROLL_DICE'
  payload: Record<string, never> // 空オブジェクト
}

/** SUBMIT_CHOICE (分岐で進路を選ぶ) */
export type SubmitChoiceMessage = {
  type: 'SUBMIT_CHOICE'
  payload: {
    selection: number // 選択したタイルID
  }
}

/** SUBMIT_QUIZ (クイズ回答を送る) */
export type SubmitQuizMessage = {
  type: 'SUBMIT_QUIZ'
  payload: {
    selection: number // 選んだ選択肢 index (0-based)
  }
}

/** SUBMIT_GAMBLE (ギャンブルの賭け内容を送る) */
export type SubmitGambleMessage = {
  type: 'SUBMIT_GAMBLE'
  payload: {
    bet: number // 賭け金
    choice: 'High' | 'Low'
  }
}

/**
 * 送信側の全メッセージ Union
 * （キューに積むとき用）
 */
export type OutgoingClientMessage =
  | RollDiceMessage
  | SubmitChoiceMessage
  | SubmitQuizMessage
  | SubmitGambleMessage

/* ============================
 * ハンドラ達（全部オプショナル）
 * ============================
 */
export type GameSocketHandlers = {
  onDiceResult?: (userID: string, diceResult: number) => void
  onPlayerMoved?: (userID: string, newPosition: number) => void
  onMoneyChanged?: (userID: string, newMoney: number) => void
  onBranchChoiceRequired?: (tileID: number, options: number[]) => void
  onQuizRequired?: (
    tileID: number,
    quizData: QuizRequiredPayload['quizData'],
  ) => void
  onGambleRequired?: (tileID: number, referenceValue: number) => void
  onGambleResult?: (
    userID: string,
    diceResult: number,
    choice: 'High' | 'Low',
    won: boolean,
    amount: number,
    newMoney: number,
  ) => void
  onPlayerFinished?: (userID: string, money: number) => void
  onPlayerStatusChanged?: (
    userID: string,
    status: string,
    value: boolean | string | number | null,
  ) => void
  onErrorMessage?: (message: string) => void
}

/* ============================
 * 呼び出し元(コンポーネント)が使うインターフェース
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

/** 現在アクティブな WebSocket コネクションを返す（未接続なら null） */
export function getActiveSocket(): GameSocketConnection | null {
  return _activeSocket
}

/* ============================
 * WebSocket 接続本体
 * ============================
 */

/**
 * WebSocket 接続 (認証トークン必須版)
 *
 * @param handlers イベントハンドラ
 * @param token Firebase Auth ID トークン (必須)
 * @returns 接続オブジェクト
 */
export function connectGameSocket(
  handlers: GameSocketHandlers,
  token: string | null, // ★ 認証トークンを引数で受け取る
): GameSocketConnection {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? ''

  // ★ トークンがない場合はエラーを出し、処理を中断
  if (!token) {
    console.error('[WS] 認証トークンがありません。接続を中止します。')
    // ダミーの接続オブジェクトを返して、後続の処理がクラッシュしないようにする
    return {
      sendRollDice: () => console.error('WS未接続: sendRollDice'),
      sendSubmitChoice: () => console.error('WS未接続: sendSubmitChoice'),
      sendSubmitQuiz: () => console.error('WS未接続: sendSubmitQuiz'),
      sendSubmitGamble: () => console.error('WS未接続: sendSubmitGamble'),
      close: () => {},
    }
  }

  // ★ URLにトークンを付与 (Goのミドルウェアが 'token' クエリを想定している場合)
  const urlWithToken = `${wsUrl}?token=${token}`

  console.log(`[WS] 接続試行: ${wsUrl}?token=...`) // (セキュリティのためトークン本体はログに出さない)
  const ws = new WebSocket(urlWithToken) // ★ 修正後のURLで接続

  let isOpen = false

  // 接続完了前に送ろうとしたメッセージを貯めておく
  const messageQueue: OutgoingClientMessage[] = []

  ws.onopen = () => {
    console.log('[WS] connected')
    isOpen = true

    // 溜まってたメッセージを送信
    for (const m of messageQueue) {
      ws.send(JSON.stringify(m))
    }
    messageQueue.length = 0
  }

  ws.onerror = (event: Event) => {
    console.error('[WS] error', event)
  }

  ws.onclose = () => {
    console.warn('[WS] closed')
    isOpen = false
  }

  ws.onmessage = (event: MessageEvent<string>) => {
    // JSON parse
    let parsed: ServerMessage
    try {
      parsed = JSON.parse(event.data) as ServerMessage
    } catch {
      console.error('[WS] invalid JSON:', event.data)
      return
    }

    const msgType: string = parsed.type

    // ★ 注意: サーバーが snake_case で送ってくる場合、ここでマッピングが必要
    // もしDICE_RESULTがsnake_case (user_id, dice_result) の場合:
    if (msgType === 'DICE_RESULT') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (parsed as any).payload // anyで受け取る
      // snake_case/camelCase 両対応 (サーバーの実装に合わせて調整)
      const userID = p.userID ?? p.user_id
      const diceResult = p.diceResult ?? p.dice_result
      handlers.onDiceResult?.(userID, diceResult)
      return
    }

    if (msgType === 'PLAYER_MOVED') {
      const p = (parsed as PlayerMovedMessage).payload
      handlers.onPlayerMoved?.(p.userID, p.newPosition)
      return
    }

    if (msgType === 'MONEY_CHANGED') {
      const p = (parsed as MoneyChangedMessage).payload
      handlers.onMoneyChanged?.(p.userID, p.newMoney)
      return
    }

    if (msgType === 'BRANCH_CHOICE_REQUIRED') {
      const p = (parsed as BranchChoiceRequiredMessage).payload
      handlers.onBranchChoiceRequired?.(p.tileID, p.options)
      return
    }

    if (msgType === 'QUIZ_REQUIRED') {
      const p = (parsed as QuizRequiredMessage).payload
      handlers.onQuizRequired?.(p.tileID, p.quizData)
      return
    }

    if (msgType === 'GAMBLE_REQUIRED') {
      const p = (parsed as GambleRequiredMessage).payload
      handlers.onGambleRequired?.(p.tileID, p.referenceValue)
      return
    }

    if (msgType === 'GAMBLE_RESULT') {
      const p = (parsed as GambleResultMessage).payload
      handlers.onGambleResult?.(
        p.userID,
        p.diceResult,
        p.choice,
        p.won,
        p.amount,
        p.newMoney,
      )
      return
    }

    if (msgType === 'PLAYER_FINISHED') {
      const p = (parsed as PlayerFinishedMessage).payload
      handlers.onPlayerFinished?.(p.userID, p.money)
      return
    }

    if (msgType === 'PLAYER_STATUS_CHANGED') {
      const p = (parsed as PlayerStatusChangedMessage).payload
      handlers.onPlayerStatusChanged?.(p.userID, p.status, p.value)
      return
    }

    if (msgType === 'ERROR') {
      const p = (parsed as ErrorMessage).payload
      handlers.onErrorMessage?.(p.message)
      return
    }

    console.warn('[WS] unhandled message:', msgType, parsed)
  }

  // 内部送信用。OPENでなければキューへ。
  function rawSend(message: OutgoingClientMessage): void {
    if (isOpen && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return
    }
    messageQueue.push(message)
  }

  /* ===== ここから外向きAPI ===== */

  function sendRollDice(): void {
    const msg: RollDiceMessage = { type: 'ROLL_DICE', payload: {} }
    rawSend(msg)
  }

  function sendSubmitChoice(selection: number): void {
    const msg: SubmitChoiceMessage = {
      type: 'SUBMIT_CHOICE',
      payload: { selection },
    }
    rawSend(msg)
  }

  function sendSubmitQuiz(selection: number): void {
    const msg: SubmitQuizMessage = {
      type: 'SUBMIT_QUIZ',
      payload: { selection },
    }
    rawSend(msg)
  }

  function sendSubmitGamble(bet: number, choice: 'High' | 'Low'): void {
    const msg: SubmitGambleMessage = {
      type: 'SUBMIT_GAMBLE',
      payload: { bet, choice },
    }
    rawSend(msg)
  }

  function close(): void {
    ws.close()
    if (_activeSocket === connection) _activeSocket = null
  }

  const connection: GameSocketConnection = {
    sendRollDice,
    sendSubmitChoice,
    sendSubmitQuiz,
    sendSubmitGamble,
    close,
  }

  // この接続を“現役”として覚えておく
  _activeSocket = connection

  return connection
}