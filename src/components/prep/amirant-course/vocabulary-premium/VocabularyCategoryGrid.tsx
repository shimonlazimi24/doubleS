"use client";

import type { VocabularyCategory } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";

export type VocabularyCategoryGridProps = {
  categories: VocabularyCategory[];
  selectedId: string | "all";
  onSelect: (id: string | "all") => void;
  className?: string;
};

/**
 * שורת פילטרים קומפקטית במקום גריד כרטיסים (DESIGN_GUIDELINES: cards רק לאובייקט
 * עצמאי משמעותי). קטגוריות ריקות - כותרות סקשן מהמקור, לא פילטר - לא מוצגות.
 */
export function VocabularyCategoryGrid({ categories, selectedId, onSelect, className }: VocabularyCategoryGridProps) {
  const real = categories.filter((c) => c.count > 0);
  if (real.length <= 1) return null;
  const total = real.reduce((s, c) => s + c.count, 0);

  const pill = (selected: boolean) =>
    cn(
      "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition",
      selected
        ? "border-[#0f2347] bg-[#0f2347] font-semibold text-white"
        : "border-line/80 bg-white text-slate-700 hover:border-primary/40 hover:text-primary",
    );

  return (
    <div className={cn("[direction:rtl] [text-align:start]", className)} role="group" aria-label="סינון לפי קטגוריה">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={pill(selectedId === "all")} onClick={() => onSelect("all")}>
          הכל
          <span className={cn("tabular-nums text-xs", selectedId === "all" ? "text-white/80" : "text-slate-400")}>
            {total}
          </span>
        </button>
        {real.map((c) => (
          <button key={c.id} type="button" className={pill(selectedId === c.id)} onClick={() => onSelect(c.id)}>
            {c.title
              .replace(/^[^֐-׿A-Za-z0-9]+\s*/, "")
              .replace(/^Section\s+[A-Z]\d+\s*[:.-]\s*/i, "") // קידומת טכנית מכותרת המקור
              .replace(/\s*\(\d+\s*[-–]\s*\d+\)\s*/g, " ") // טווחי (1-30) - הספירה כבר בפיל
              .replace(/:\s*$/, "")
              .trim()}
            <span className={cn("tabular-nums text-xs", selectedId === c.id ? "text-white/80" : "text-slate-400")}>
              {c.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
