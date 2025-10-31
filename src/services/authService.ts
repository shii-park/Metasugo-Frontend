// src/services/authService.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth } from "../firebase";

// IDトークン取得用のラッパー
const getToken = async (user: User) => {
  return user.getIdToken(); // デフォルトでトークンの有効期限は1時間
};

// サインアップ
export const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
};

// ログイン
export const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
};

// ログアウト
export const logout = () => signOut(auth);
