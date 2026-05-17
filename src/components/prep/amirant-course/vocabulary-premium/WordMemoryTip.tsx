"use client";

import { cn } from "@/lib/design-system/cn";

export type WordMemoryTipProps = {
  text: string;
  className?: string;
};

export function WordMemoryTip({ text, className }: WordMemoryTipProps) {
  if (!text.trim()) return null;
  return (
    <div
      className={cn(
        "rounded-xl border border-sky-100/90 bg-sky-50/40 px-3 py-3 [direction:rtl] [text-align:start]",
        className,
      )}
      lang="he"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/85">טיפ לזיכרון</p>
      <p className="mt-1.5 text-base leading-8 text-slate-800 [text-wrap:pretty]">{text}</p>
    </div>
  );
}
