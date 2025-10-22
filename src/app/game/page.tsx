// /game にアクセスされた際に、最初のマップ (/game/1) へリダイレクトする。

// src/app/game/page.tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/game/1");
}
