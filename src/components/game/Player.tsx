'use client';
import Image from 'next/image';
import { useMemo } from 'react';

type Props = {
  col: number;
  row: number;
  colsPct: number[];
  rowsPct: number[];
  padXPct: number;
  padTopPct: number;
  padBottomPct: number;
  label?: string;
  imgSrc?: string;
};

function centerPctFromIndex(arr: number[], idx1: number, padStart = 0, padEnd = 0) {
  const i = Math.max(0, idx1 - 1);
  const before = arr.slice(0, i).reduce((a, b) => a + b, 0);
  const width = arr[i] ?? 0;
  const total = arr.reduce((a, b) => a + b, 0) + padStart + padEnd;
  const center = padStart + before + width / 2;
  return (center / total) * 100;
}

export default function Player({
  col,
  row,
  colsPct,
  rowsPct,
  padXPct,
  padTopPct,
  padBottomPct,
  label = 'あなた',
  imgSrc = '/player1.png',
}: Props) {
  const leftPct = useMemo(() => centerPctFromIndex(colsPct, col, padXPct, padXPct), [colsPct, col, padXPct]);
  const topPct  = useMemo(() => centerPctFromIndex(rowsPct, row, padTopPct, padBottomPct), [rowsPct, row, padTopPct, padBottomPct]);

  return (
    <div
      className="absolute z-20 transition-[left,top] duration-500 ease-out"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -100%)' }}
    >
      <div className="mb-1 rounded-md bg-white/90 px-2 py-0.5 text-[12px] font-medium shadow">
        {label}
      </div>
      <Image src={imgSrc} alt={label} width={52} height={52} draggable={false} className="drop-shadow" />
    </div>
  );
}
