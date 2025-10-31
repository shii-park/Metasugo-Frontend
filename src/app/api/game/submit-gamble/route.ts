// 作成するファイル: src/app/api/game/submit-gamble/route.ts

import { NextResponse } from 'next/server';

// フロントから送られてくるデータの型 (payload)
type GamblePayload = {
  bet: number;
  choice: 'High' | 'Low';
}

/**
 * ギャンブルのロジックを実行するAPI (POST)
 */
export async function POST(req: Request) {
  try {
    // 1. フロントからのリクエストを受け取る
    const body: { type: "SUBMIT_GAMBLE", payload: GamblePayload } = await req.json();
    
    // 2. payload を取り出す
    const { bet, choice } = body.payload;

    // (ここでバリデーション: bet が所持金を超えてないか？などは
    //  本当はバックエンド側でも行うべきですが、一旦省略します)

    // 3. バックエンドでサイコロを振る (1〜6)
    const diceResult = Math.floor(Math.random() * 6) + 1;

    // 4. 勝敗を判定する (ルール: 3より大きいか)
    const isHigh = diceResult > 3; // (4, 5, 6 が true)
    let won = false;
    if (choice === 'High' && isHigh) {
      won = true;
    } else if (choice === 'Low' && !isHigh) {
      won = true;
    }

    // 5. フロントに返すレスポンスを作成
    const resultPayload = {
      diceResult: diceResult,
      choice: choice,
      won: won,
      amount: bet, // 変動額（＝賭け金）
      newMoney: 10000 // (※) 注意: バックエンドは所持金を知らないため
                      // 本来はDB等から計算すべき。フロント側で計算するならこの値は無視される。
    };

    // 6. 成功レスポンスを返す (これが MoneyPlus の .json() で data に入る)
    return NextResponse.json({
      type: "GAMBLE_RESULT",
      payload: resultPayload
    }, { status: 200 });

  } catch (error) {
    // 7. エラーが発生した場合
    console.error("Gamble API Error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}