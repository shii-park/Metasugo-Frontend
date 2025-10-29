// src/lib/game/wsClient.ts

/**
 * ===== サーバー -> クライアント メッセージ型 =====
 */

// "DICE_RESULT"
export type DiceResultPayload = {
  userID: string;
  diceResult: number;
};
export type DiceResultMessage = {
  type: "DICE_RESULT";
  payload: DiceResultPayload;
};

// "PLAYER_MOVED"
export type PlayerMovedPayload = {
  userID: string;
  newPosition: number;
};
export type PlayerMovedMessage = {
  type: "PLAYER_MOVED";
  payload: PlayerMovedPayload;
};

// "BRANCH_CHOICE_REQUIRED"
export type BranchChoiceRequiredPayload = {
  tileID: number;
  options: number[]; // 進める候補タイルIDたち
};
export type BranchChoiceRequiredMessage = {
  type: "BRANCH_CHOICE_REQUIRED";
  payload: BranchChoiceRequiredPayload;
};

// サーバーから飛んでくるメッセージのユニオン
export type ServerMessage =
  | DiceResultMessage
  | PlayerMovedMessage
  | BranchChoiceRequiredMessage;

/**
 * ===== クライアント -> サーバー メッセージ型 =====
 */

// "ROLL_DICE"
export type RollDiceMessage = {
  type: "ROLL_DICE";
  payload: Record<string, never>;
};

// (将来用) "SUBMIT_CHOICE"
export type SubmitChoiceMessage = {
  type: "SUBMIT_CHOICE";
  payload: {
    selection: number; // 分岐先に選んだタイルID
  };
};

/**
 * ===== ハンドラ（Game1 側から渡すコールバック） =====
 */
export type GameSocketHandlers = {
  onDiceResult: (userID: string, diceResult: number) => void;
  onPlayerMoved: (userID: string, newPosition: number) => void;

  // 分岐が必要になったとき
  onBranchChoiceRequired: (tileID: number, options: number[]) => void;
};

/**
 * ===== 呼び出し元が使うインターフェース =====
 */
export type GameSocketConnection = {
  sendRollDice: () => void;
  // 将来: 分岐選択を送る用
  sendSubmitChoice: (selection: number) => void;
  close: () => void;
};

/**
 * ===== WebSocket接続本体 =====
 *
 * 認証なし版（/ws/connection にそのまま繋ぐ）
 */
export function connectGameSocket(
  handlers: GameSocketHandlers
): GameSocketConnection {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "";
  const ws = new WebSocket(wsUrl);

  let isOpen = false;
  const messageQueue: Array<RollDiceMessage | SubmitChoiceMessage> = [];

  ws.onopen = () => {
    console.log("[WS] connected");
    isOpen = true;
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
    let parsed: ServerMessage;
    try {
      parsed = JSON.parse(event.data) as ServerMessage;
    } catch {
      console.error("[WS] invalid JSON:", event.data);
      return;
    }

    const msgType: string = parsed.type;

    if (msgType === "DICE_RESULT") {
      const payload = (parsed as DiceResultMessage).payload;
      handlers.onDiceResult(payload.userID, payload.diceResult);
      return;
    }

    if (msgType === "PLAYER_MOVED") {
      const payload = (parsed as PlayerMovedMessage).payload;
      handlers.onPlayerMoved(payload.userID, payload.newPosition);
      return;
    }

    if (msgType === "BRANCH_CHOICE_REQUIRED") {
      const payload = (parsed as BranchChoiceRequiredMessage).payload;
      handlers.onBranchChoiceRequired(payload.tileID, payload.options);
      return;
    }

    console.warn("[WS] unhandled message:", msgType, parsed);
  };

  // 送信用（まだOPENじゃなかったらキューに積む）
  function rawSend(message: RollDiceMessage | SubmitChoiceMessage): void {
    if (isOpen && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return;
    }
    messageQueue.push(message);
  }

  function sendRollDice(): void {
    const message: RollDiceMessage = {
      type: "ROLL_DICE",
      payload: {},
    };
    rawSend(message);
  }

  function sendSubmitChoice(selection: number): void {
    const msg: SubmitChoiceMessage = {
      type: "SUBMIT_CHOICE",
      payload: { selection },
    };
    rawSend(msg);
  }

  function close(): void {
    ws.close();
  }

  return {
    sendRollDice,
    sendSubmitChoice,
    close,
  };
}
