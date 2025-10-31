// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { auth } from "../firebase";

// IDトークン取得用のラッパー
const getToken = async (user: User) => {
  return user.getIdToken(); // デフォルトでトークンの有効期限は1時間
};

// 🔹 サインアップ（ユーザーネーム対応版）
export const signup = async ( username: string, email: string, password: string) => {
  try {
    // 1. Firebase Auth でユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. 作成直後に displayName を設定
    await updateProfile(user, { displayName: username });

    // 3. プロフィール更新が完了したら、トークンを取得
    const token = await user.getIdToken();

    console.log("✅ サインアップ完了:", {
      username: user.displayName,
      email: user.email,
      uid: user.uid,
    });

    // 4. 呼び出し元に返却
    return { user, token };
  } catch (error: any) {
    console.error("❌ サインアップエラー:", error.code, error.message);
    throw error;
  }
};

// 🔹 ログイン（メール＋パスワード）
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();

    console.log("✅ ログイン成功:", {
      email: user.email,
      username: user.displayName,
      uid: user.uid,
    });

    return { user, token };
  } catch (error: any) {
    console.error("❌ ログインエラー:", error.code, error.message);
    throw error;
  }
};

// 🔹 ログアウト
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("👋 ログアウト完了");
  } catch (error: any) {
    console.error("❌ ログアウトエラー:", error.code, error.message);
    throw error;
  }
};
