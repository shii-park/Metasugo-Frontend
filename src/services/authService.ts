// src/services/authService.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "firebase/auth";
import { auth } from "../firebase";

// サインアップ
export const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

// ログイン
export const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

// ログアウト
export const logout = () => signOut(auth);