import Image from "next/image";
import "./../globals.css";

export default function Game() {
  return (
    <div className="relative w-full h-screen bg-brown-light">
      <Image
        src="/back1.png"
        alt=""
        fill
        className="object-contain z-0 pointer-events-none"
        aria-hidden="true"
        priority
      />
      <div className="relative z-10 w-full h-full flex justify-center items-center">
        <div>
          game
          <div>すごろく画面</div>
        </div>
      </div>
    </div>
  );
}
