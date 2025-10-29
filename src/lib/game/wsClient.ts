// src/lib/game/wsClient.ts

/**
 * WebSocketクライアント (フロント側)
 *
 * - NEXT_PUBLIC_WS_URL でサーバー (例: ws://localhost:8080/ws/connection)
 * - 認証トークンなし版
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
  userID: string;
  diceResult: number;
};
export type DiceResultMessage = {
  type: "DICE_RESULT";
  payload: DiceResultPayload;
};

/** PLAYER_MOVED */
export type PlayerMovedPayload = {
  userID: string;
  newPosition: number; // サーバーが正とするタイルID
};
export type PlayerMovedMessage = {
  type: "PLAYER_MOVED";
  payload: PlayerMovedPayload;
};

/** MONEY_CHANGED */
export type MoneyChangedPayload = {
  userID: string;
  newMoney: number;
};
export type MoneyChangedMessage = {
  type: "MONEY_CHANGED";
  payload: MoneyChangedPayload;
};

/** BRANCH_CHOICE_REQUIRED */
export type BranchChoiceRequiredPayload = {
  tileID: number;
  options: number[]; // 進める候補タイルID
};
export type BranchChoiceRequiredMessage = {
  type: "BRANCH_CHOICE_REQUIRED";
  payload: BranchChoiceRequiredPayload;
};

/** QUIZ_REQUIRED */
export type QuizRequiredPayload = {
  tileID: number;
  quizData: {
    id: number;
    question: string;
    options: string[];
    answer_description: string;
  };
};
export type QuizRequiredMessage = {
  type: "QUIZ_REQUIRED";
  payload: QuizRequiredPayload;
};

/** GAMBLE_REQUIRED */
export type GambleRequiredPayload = {
  tileID: number;
  referenceValue: number; // High/Low の基準
};
export type GambleRequiredMessage = {
  type: "GAMBLE_REQUIRED";
  payload: GambleRequiredPayload;
};

/** GAMBLE_RESULT */
export type GambleResultPayload = {
  userID: string;
  diceResult: number;
  choice: "High" | "Low";
  won: boolean;
  amount: number;
  newMoney: number;
};
export type GambleResultMessage = {
  type: "GAMBLE_RESULT";
  payload: GambleResultPayload;
};

/** PLAYER_FINISHED */
export type PlayerFinishedPayload = {
  userID: string;
  money: number;
};
export type PlayerFinishedMessage = {
  type: "PLAYER_FINISHED";
  payload: PlayerFinishedPayload;
};

/** PLAYER_STATUS_CHANGED */
export type PlayerStatusChangedPayload = {
  userID: string;
  status: string; // "isMarried" | "hasChildren" | "job" など
  value: boolean | string | number | null;
};
export type PlayerStatusChangedMessage = {
  type: "PLAYER_STATUS_CHANGED";
  payload: PlayerStatusChangedPayload;
};

/** ERROR */
export type ErrorPayload = {
  message: string;
};
export type ErrorMessage = {
  type: "ERROR";
  payload: ErrorPayload;
};

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
  | ErrorMessage;

/* ============================
 * クライアント -> サーバー メッセージ型
 * ============================
 */

/** ROLL_DICE */
export type RollDiceMessage = {
  type: "ROLL_DICE";
  payload: Record<string, never>; // 空オブジェクト
};

/** SUBMIT_CHOICE (分岐で進路を選ぶ) */
export type SubmitChoiceMessage = {
  type: "SUBMIT_CHOICE";
  payload: {
    selection: number; // 選択したタイルID
  };
};

/** SUBMIT_QUIZ (クイズ回答を送る) */
export type SubmitQuizMessage = {
  type: "SUBMIT_QUIZ";
  payload: {
    selection: number; // 選んだ選択肢 index (0-based)
  };
};

/** SUBMIT_GAMBLE (ギャンブルの賭け内容を送る) */
export type SubmitGambleMessage = {
  type: "SUBMIT_GAMBLE";
  payload: {
    bet: number; // 賭け金
    choice: "High" | "Low";
  };
};

/**
 * 送信側の全メッセージ Union
 * （キューに積むとき用）
 */
export type OutgoingClientMessage =
  | RollDiceMessage
  | SubmitChoiceMessage
  | SubmitQuizMessage
  | SubmitGambleMessage;

/* ============================
 * ハンドラ達
 * ============================
 *
 * それぞれ「そのイベントが来たときにフロント側でどうするか」を
 * Game1などのコンポーネントから渡してもらう。
 *
 * まだ使わないイベントもあるので全部オプショナルにしてある。
 */

export type GameSocketHandlers = {
  // サイコロ結果
  onDiceResult?: (userID: string, diceResult: number) => void;

  // 公式のプレイヤー座標更新
  onPlayerMoved?: (userID: string, newPosition: number) => void;

  // 所持金が変わった
  onMoneyChanged?: (userID: string, newMoney: number) => void;

  // 分岐マスにいて選択肢を提示する
  onBranchChoiceRequired?: (tileID: number, options: number[]) => void;

  // クイズマス
  onQuizRequired?: (
    tileID: number,
    quizData: QuizRequiredPayload["quizData"]
  ) => void;

  // ギャンブルマスでベット内容を要求
  onGambleRequired?: (tileID: number, referenceValue: number) => void;

  // ギャンブル結果
  onGambleResult?: (
    userID: string,
    diceResult: number,
    choice: "High" | "Low",
    won: boolean,
    amount: number,
    newMoney: number
  ) => void;

  // ゴールした
  onPlayerFinished?: (userID: string, money: number) => void;

  // ステータス変化（結婚した・子供できた・職業変わった 等）
  onPlayerStatusChanged?: (
    userID: string,
    status: string,
    value: boolean | string | number | null
  ) => void;

  // サーバーからのエラー通知
  onErrorMessage?: (message: string) => void;
};

/* ============================
 * 呼び出し元(コンポーネント)が使うインターフェース
 * ============================
 */
export type GameSocketConnection = {
  sendRollDice: () => void;
  sendSubmitChoice: (selection: number) => void;
  sendSubmitQuiz: (selection: number) => void;
  sendSubmitGamble: (bet: number, choice: "High" | "Low") => void;
  close: () => void;
};

/* ============================
 * WebSocket 接続本体
 * ============================
 *
 * 認証なし版: NEXT_PUBLIC_WS_URL そのままに接続
 *
 * - まだopenじゃない状態で send されたメッセージはキューに積む
 * - open後にまとめて flush
 */
export function connectGameSocket(
  handlers: GameSocketHandlers
): GameSocketConnection {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "";
  const ws = new WebSocket(wsUrl);

  let isOpen = false;

  // 接続完了前に送ろうとしたメッセージを貯めておく
  const messageQueue: OutgoingClientMessage[] = [];

  ws.onopen = () => {
    console.log("[WS] connected");
    isOpen = true;

    // 溜まってたメッセージを送信
    for (const m of messageQueue) {
      ws.send(JSON.stringify(m));
    }
    messageQueue.length = 0;
  };

  ws.onerror = (event: Event) => {
    console.error("[WS] error", event);
  };

  ws.onclose = () => {
    console.warn("[WS] closed");
    isOpen = false;
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    // JSON parse
    let parsed: ServerMessage;
    try {
      parsed = JSON.parse(event.data) as ServerMessage;
    } catch {
      console.error("[WS] invalid JSON:", event.data);
      return;
    }

    // `never` 回避のため、まずは type を string として取り出してから分岐
    const msgType: string = parsed.type;

    // DICE_RESULT
    if (msgType === "DICE_RESULT") {
      const p = (parsed as DiceResultMessage).payload;
      handlers.onDiceResult?.(p.userID, p.diceResult);
      return;
    }

    // PLAYER_MOVED
    if (msgType === "PLAYER_MOVED") {
      const p = (parsed as PlayerMovedMessage).payload;
      handlers.onPlayerMoved?.(p.userID, p.newPosition);
      return;
    }

    // MONEY_CHANGED
    if (msgType === "MONEY_CHANGED") {
      const p = (parsed as MoneyChangedMessage).payload;
      handlers.onMoneyChanged?.(p.userID, p.newMoney);
      return;
    }

    // BRANCH_CHOICE_REQUIRED
    if (msgType === "BRANCH_CHOICE_REQUIRED") {
      const p = (parsed as BranchChoiceRequiredMessage).payload;
      handlers.onBranchChoiceRequired?.(p.tileID, p.options);
      return;
    }

    // QUIZ_REQUIRED
    if (msgType === "QUIZ_REQUIRED") {
      const p = (parsed as QuizRequiredMessage).payload;
      handlers.onQuizRequired?.(p.tileID, p.quizData);
      return;
    }

    // GAMBLE_REQUIRED
    if (msgType === "GAMBLE_REQUIRED") {
      const p = (parsed as GambleRequiredMessage).payload;
      handlers.onGambleRequired?.(p.tileID, p.referenceValue);
      return;
    }

    // GAMBLE_RESULT
    if (msgType === "GAMBLE_RESULT") {
      const p = (parsed as GambleResultMessage).payload;
      handlers.onGambleResult?.(
        p.userID,
        p.diceResult,
        p.choice,
        p.won,
        p.amount,
        p.newMoney
      );
      return;
    }

    // PLAYER_FINISHED
    if (msgType === "PLAYER_FINISHED") {
      const p = (parsed as PlayerFinishedMessage).payload;
      handlers.onPlayerFinished?.(p.userID, p.money);
      return;
    }

    // PLAYER_STATUS_CHANGED
    if (msgType === "PLAYER_STATUS_CHANGED") {
      const p = (parsed as PlayerStatusChangedMessage).payload;
      handlers.onPlayerStatusChanged?.(p.userID, p.status, p.value);
      return;
    }

    // ERROR
    if (msgType === "ERROR") {
      const p = (parsed as ErrorMessage).payload;
      handlers.onErrorMessage?.(p.message);
      return;
    }

    // 将来的にサーバーが増やす未知のtype
    console.warn("[WS] unhandled message:", msgType, parsed);
  };

  /**
   * 内部用: 送信。
   * まだ readyState が OPEN じゃない場合はキューに積む。
   */
  function rawSend(message: OutgoingClientMessage): void {
    if (isOpen && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return;
    }
    messageQueue.push(message);
  }

  /* ===== ここから外向きAPI ===== */

  /** サイコロを振る要求を送る */
  function sendRollDice(): void {
    const msg: RollDiceMessage = {
      type: "ROLL_DICE",
      payload: {},
    };
    rawSend(msg);
  }

  /** 分岐マスでプレイヤーが進みたい先を送る */
  function sendSubmitChoice(selection: number): void {
    const msg: SubmitChoiceMessage = {
      type: "SUBMIT_CHOICE",
      payload: { selection },
    };
    rawSend(msg);
  }

  /** クイズ回答（何番を選んだか）を送る */
  function sendSubmitQuiz(selection: number): void {
    const msg: SubmitQuizMessage = {
      type: "SUBMIT_QUIZ",
      payload: { selection },
    };
    rawSend(msg);
  }

  /** ギャンブルのベット内容を送る */
  function sendSubmitGamble(bet: number, choice: "High" | "Low"): void {
    const msg: SubmitGambleMessage = {
      type: "SUBMIT_GAMBLE",
      payload: { bet, choice },
    };
    rawSend(msg);
  }

  /** ソケットを閉じる */
  function close(): void {
    ws.close();
  }

  return {
    sendRollDice,
    sendSubmitChoice,
    sendSubmitQuiz,
    sendSubmitGamble,
    close,
  };
}
