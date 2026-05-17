"use client";

import { cn } from "@/lib/design-system/cn";

export type VocabularyStatCardProps = {
  label: string;
  value: string;
  note?: string;
  className?: string;
};

export function VocabularyStatCard({ label, value, note, className }: VocabularyStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,35,71,0.05)] [direction:rtl] [text-align:start]",
        className,
      )}
    >
      <p className="text-sm font-medium text-slate-500 [text-wrap:balance]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0f2347]">{value}</p>
      {note ? <p className="mt-1 text-sm leading-snug text-slate-600 [text-wrap:pretty]">{note}</p> : null}
    </div>
  );
}
