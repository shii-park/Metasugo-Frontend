"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { login } from "../../services/authService";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      router.push("/"); // ログイン後に遷移
    } catch (err: any) {
      const message =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
          ? "メールアドレスまたはパスワードが間違っています。"
          : err.message;
      setError(message);
    }
  };

  return (
    <div>
      <div className="portrait:fixed portrait:inset-0 portrait:bg-[#5B7BA6] portrait:text-white portrait:text-2xl portrait:flex portrait:items-center portrait:justify-center portrait:z-50 portrait:overflow-hidden portrait:touch-none">
        画面を横向きにしてください
      </div>

      <div className="fixed inset-0 flex h-[100dvh] items-center justify-center bg-black overflow-hidden">
        <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video bg-[#E3DECF] py-2 px-4">
          <img
            src="/logo.svg"
            alt="ロゴ"
            className="absolute top-3 left-10"
          />
          <div className="flex justify-center items-center border-2 border-white w-full h-full">
            <form onSubmit={handleLogin} className="relative mx-4 w-full h-hull">
              <div className="font-bold text-3xl text-[#5B7BA6] flex items-center justify-center mb-8">
                ログイン
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="text-red-500 text-center text-sm mb-1">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-center py-2 px-4">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center justify-center py-2 px-4">
                <input
                  type="password"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex justify-center items-center mt-8 text-2xl">
                <button type="submit" className="rounded-lg bg-[#5B7BA6] font-bold text-white px-12 py-1">
                  ログイン
                </button>
              </div>
              <div className="flex justify-center items-center mt-4 text-2xl">
                <Link href="/signup" className="rounded-lg font-bold text-[#5B7BA6] px-12 py-1">
                  新規登録
                </Link>
              </div>
            </form>

            <div>
              <img
                src="/dice.png"
                alt="サイコロ"
                className="absolute bottom-8 right-12 w-24 h-auto m-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
