"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { logout } from "../services/authService";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>ログインしてください...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#E3DECF]">
      <h1 className="text-3xl font-bold text-[#5B7BA6] mb-6">
        ようこそ、{user.email} さん！
      </h1>
      <button
        onClick={handleLogout}
        className="bg-[#5B7BA6] text-white py-2 px-4 rounded hover:bg-[#4A6991]"
      >
        ログアウト
      </button>
    </div>
  );
    // <div className="w-full h-auto">
    //   <div>home</div>
    //   <div>ここにはゲームスタートとかのボタンがあるかんじ</div>
    // </div>
  // );
}
