// firebase-auth-shim.d.ts
// Firebase Auth モジュールの最小限の型を教えてあげるshim。
// any / unknown を使わずに、今回使うものだけ定義してる。

declare module 'firebase/auth' {
  // 最低限使うユーザー情報
  export interface User {
    email: ReactNode;
    uid: string;
  }

  // Auth本体。中身まではここでは使わないので空オブジェクト型でOK
  export type Auth = object

  // getAuth(app) -> Auth
  // app は firebase/app で作ったやつが入るけど、ここでは {} 型で十分
  export function getAuth(app: object): Auth;

  // 現在のログイン状態を購読
  export function onAuthStateChanged(
    auth: Auth,
    callback: (user: User | null) => void
  ): () => void;

  // IDトークンを取得
  export function getIdToken(
    user: User,
    forceRefresh?: boolean
  ): Promise<string>;
}
