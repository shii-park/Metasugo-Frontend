// Tile.tsx
// 盤面内の絶対配置マス（見た目のみ）
// x, y: 0〜100 の割合（%）で位置指定。sizePct: 盤面に対する%サイズ。

export default function Tile({
  x,
  y,
  sizePct = 6,                    // ← デフォルトは盤面幅/高に対する 6%
  pxSize,                          // ← ピクセル指定したい場合だけ使用（任意）
  colorClass = "bg-blue-default",
  shape = "square",
  label,
  className = "",
  onClick,
}: {
  x: number;                       // 0〜100 (%)
  y: number;                       // 0〜100 (%)
  sizePct?: number;                // % サイズ（幅・高ともに同じ値）
  pxSize?: number;                 // ピクセルサイズ（優先される）
  colorClass?: string;
  shape?: "square" | "circle";
  label?: string;
  className?: string;
  onClick?: () => void;
}) {
  const radius = shape === "circle" ? "rounded-full" : "rounded-md";

  // 0〜100 にクランプして安全に
  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? "マス"}
      className={[
        "absolute",
        "-translate-x-1/2 -translate-y-1/2", // 中央を座標に合わせる
        "border border-black/10",
        radius,
        colorClass,
        "focus:outline-none focus:ring-4 focus:ring-black/10",
        "shadow-sm",
        className,
      ].join(" ")}
      style={{
        left: `${clamp(x)}%`,
        top: `${clamp(y)}%`,
        width: pxSize ? pxSize : `${sizePct}%`,
        height: pxSize ? pxSize : `${sizePct}%`,
      }}
    />
  );
}
