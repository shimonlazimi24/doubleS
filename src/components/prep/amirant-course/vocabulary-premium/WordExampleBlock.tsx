"use client";

import { cn } from "@/lib/design-system/cn";

export type WordExampleBlockProps = {
  text: string;
  index?: number;
  className?: string;
};

/** English example in a calm, readable block (LTR). */
export function WordExampleBlock({ text, index, className }: WordExampleBlockProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-100/90 bg-stone-50/60 px-3 py-2.5 text-base leading-8 text-slate-800 [text-wrap:pretty] [direction:ltr] [text-align:start]",
        className,
      )}
      dir="ltr"
      lang="en"
      translate="yes"
    >
      {index != null ? (
        <span className="me-2 font-mono text-xs text-slate-400" aria-hidden>
          {index + 1}.
        </span>
      ) : null}
      {text}
    </div>
  );
}
