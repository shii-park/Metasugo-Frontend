export default function SignIn() {
  return (
    <div>
      <div className="portrait:fixed portrait:inset-0 portrait:bg-[#5B7BA6] portrait:text-white portrait:text-2xl portrait:flex portrait:items-center portrait:justify-center portrait:z-50 portrait:overflow-hidden portrait:touch-none">
        画面を横向きにしてください
      </div>

      <div className="fixed inset-0 flex h-[100dvh] items-center justify-center bg-black overflow-hidden">
        <div className="relative w-full h-full max-w-[177.78vh] max-h-[56.25vw] aspect-video bg-[#E3DECF] py-2 px-4">
          <div className="border-2 border-white w-full h-full">
            <div className="relative my-2 mx-4">
              <div className="text-[#5B7BA6] text-lg">
                タイトル
              </div>
              <div className="font-bold text-3xl text-[#5B7BA6] flex items-center justify-center m-8">
                ログイン
              </div>
              <div className="flex items-center justify-center py-2 px-4">
                <input
                  type="text"
                  placeholder="メールアドレス"
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-center justify-center py-2 px-4">
                <input
                  type="password"
                  placeholder="パスワード"
                  className="border border-[#5B7BA6] bg-white rounded-lg text-[#5B7BA6] text-sm px-2 py-1 w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex justify-center items-center mt-8 text-2xl">
                <button className="rounded-lg bg-[#5B7BA6] font-bold text-white px-12 py-1">
                  ログイン
                </button>
              </div>
              <div className="flex justify-center items-center m-4 text-2xl">
                <button className="rounded-lg font-bold text-[#5B7BA6] px-12 py-1">
                  新規登録
                </button>
              </div>
            </div>
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
