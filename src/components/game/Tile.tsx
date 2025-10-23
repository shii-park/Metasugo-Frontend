type Props = {
  col: number;
  row: number;
  sizeInCellPct?: number;
  colorClass?: string;
  className?: string;
  label?: string;
  onClick?: () => void;
};

export default function Tile({
  col,
  row,
  sizeInCellPct = 100,
  colorClass = "bg-blue-default",
  className = "",
  label,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      aria-label={label ?? "マス"}
      onClick={onClick}
      style={{ 
        gridColumn: col, 
        gridRow: row,
        width: `${sizeInCellPct}%`,
        height: `${sizeInCellPct}%`,
        placeSelf: 'center',}}
      className={[
        // "place-self-center",
        // `w-[${sizeInCellPct}%]`,
        "aspect-square",
        "border-2 border-white shadow-sm",
        colorClass,
        "outline-none focus-visible:ring-2 focus-visible:ring-black/10",
        className,
      ].join(" ")}
    />
  );
}
