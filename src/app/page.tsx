export default function Home() {
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
          <div className= "flex justify-center items-center border-2 border-white w-full h-full">
            <div className="relative mx-4 w-full h-hull">
              <div className="font-bold text-3xl text-[#5B7BA6] flex items-center justify-center text-center m-8">
                わくわく！<br />高専教員なりきりゲーム
              </div>
              <div className="font-bold text-2xl text-[#5B7BA6] flex items-center justify-center m-8">
               ～お前も高専教員にならないか～
              </div>
              <div className="font-bold bg-white text-l text-[#5B7BA6] flex-col items-center justify-center px-6 py-4 w-2/5 mx-auto">
                <p className="flex justify-between w-full">
                  <span>最高金額</span>
                  <span>○○円</span>
                </p>
                <p className="flex justify-between w-full">
                  <span>ランキング</span>
                  <span>○○円</span>
                </p>
              </div>
              <div className="flex justify-center items-center mt-8 text-2xl">
                <button className="rounded-lg bg-[#5B7BA6] font-bold text-white px-12 py-1">
                  スタート
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
