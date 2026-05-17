"use client";

import { cn } from "@/lib/design-system/cn";

export type VocabularyCategoryCardProps = {
  title: string;
  count: number;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

/** Category filter chip / card. */
export function VocabularyCategoryCard({ title, count, selected, onSelect, className }: VocabularyCategoryCardProps) {
  const Comp = onSelect ? "button" : "div";
  return (
    <Comp
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border px-3 py-2.5 text-start transition [direction:rtl]",
        selected
          ? "border-sky-400/60 bg-sky-50/80 ring-1 ring-sky-200/60"
          : "border-slate-200/90 bg-white hover:border-slate-300/90 hover:bg-stone-50/50",
        onSelect && "cursor-pointer",
        className,
      )}
    >
      <p className="text-sm font-semibold text-[#0f2347] [text-wrap:pretty]">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{count} מילים</p>
    </Comp>
  );
}
