"use client";

import { cn } from "@/lib/design-system/cn";

export type VocabularyProgressBarProps = {
  value: number;
  max: number;
  label?: string;
  className?: string;
};

export function VocabularyProgressBar({ value, max, label, className }: VocabularyProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("w-full [direction:rtl] [text-align:start]", className)}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm text-slate-600">
          <span>{label}</span>
          <span className="tabular-nums text-slate-500">
            {value}/{max}
          </span>
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "התקדמות"}
      >
        <div
          className="h-full rounded-full bg-sky-500 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
