"use client";

import React, { useState } from "react";
import { signup } from "../../services/authService";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); 
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); 

    if (password !== confirmPassword) {
      setErrorMessage("パスワードが一致しません。");
      return;
    }

    try {
      console.log("サインアップ開始");
      const userData = await signup(email, password);
      console.log("サインアップ成功:", userData);

      localStorage.setItem("user", JSON.stringify(userData));

      console.log("ホーム画面へ遷移します");
      router.push("/"); // 登録後に遷移
    } catch (error: any) {
      console.error("サインアップエラー:", error);

      // Firebaseのエラーコードに応じたメッセージを表示
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("このメールアドレスは既に登録されています。");
      } else if (error.code === "auth/invalid-email") {
        setErrorMessage("メールアドレスの形式が正しくありません。");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("パスワードは6文字以上にしてください。");
      } else {
        setErrorMessage("サインアップに失敗しました。");
      }
    }
  };

  return (
    <div>
      <div className="portrait:fixed portrait:inset-0 portrait:bg-[#5B7BA6] portrait:text-white portrait:text-2xl portrait:flex portrait:items-center portrait:justify-center portrait:z-50 portrait:overflow-hidden portrait:touch-none">
        画面を横向きにしてください
      </div>

      <div className="fixed inset-0 flex h-[100dvh] items-center justify-center bg-black overflow-hidden">
        <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video bg-[#E3DECF] py-2 px-4">
          <img src="/logo.svg" alt="ロゴ" className="absolute top-3 left-10" />

          <div className="flex justify-center items-center border-2 border-white w-full h-full">
            <form onSubmit={handleSignup} className="relative mx-4 w-full h-hull">
              <div className="font-bold text-3xl text-[#5B7BA6] flex items-center justify-center mb-4">
                新規登録
              </div>

              {/* エラーメッセージ*/}
              {errorMessage && (
                <div className="text-red-600 text-center text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-center py-2 px-4 w-full">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center justify-center py-2 px-4 w-full">
                <input
                  type="password"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center justify-center py-2 px-4 w-full">
                <input
                  type="password"
                  placeholder="パスワード（確認）"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex justify-center items-center mt-6 text-2xl">
                <button type="submit" className="rounded-lg bg-[#5B7BA6] font-bold text-white px-12 py-1">
                  新規登録
                </button>
              </div>

              <div className="flex justify-center items-center mt-4 text-2xl">
                <Link href="/signin" className="rounded-lg font-bold text-[#5B7BA6] px-12 py-1">
                  キャンセル
                </Link>
              </div>
            </form>

            <div>
              <img
                src="/gold.png"
                alt="金貨"
                className="absolute bottom-8 right-12 w-24 h-auto m-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
