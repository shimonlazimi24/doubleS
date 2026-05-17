"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabularyWord } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system/cn";
import { WordCard } from "./WordCard";

export type DeckMetrics = { start: number; perView: number; filteredTotal: number };

export type WordLearningDeckProps = {
  words: VocabularyWord[];
  categoryFilter: string | "all";
  /** Fired when navigation or filter changes — for lesson progress UI. */
  onDeckMetrics?: (m: DeckMetrics) => void;
  className?: string;
};

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/**
 * Filters words, shows 1–3 cards per view, prev/next, search, optional full list in details.
 */
export function WordLearningDeck({ words, categoryFilter, onDeckMetrics, className }: WordLearningDeckProps) {
  const [query, setQuery] = useState("");
  const [start, setStart] = useState(0);
  const [perView, setPerView] = useState<1 | 2 | 3>(1);

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    return words.filter((w) => {
      if (categoryFilter !== "all" && w.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q)
      );
    });
  }, [words, categoryFilter, query]);

  const total = filtered.length;
  const maxStart = Math.max(0, total - perView);
  const safeStart = Math.min(start, maxStart);

  const visible = filtered.slice(safeStart, safeStart + perView);

  useEffect(() => {
    onDeckMetrics?.({ start: safeStart, perView, filteredTotal: total });
  }, [safeStart, perView, total, onDeckMetrics]);

  const goPrev = useCallback(() => {
    setStart((s) => Math.max(0, s - perView));
  }, [perView]);

  const goNext = useCallback(() => {
    setStart((s) => Math.min(maxStart, s + perView));
  }, [maxStart, perView]);

  const onPerView = useCallback((n: 1 | 2 | 3) => {
    setPerView(n);
    setStart(0);
  }, []);

  if (total === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-slate-200/90 bg-stone-50/40 p-6 text-center text-slate-600 [direction:rtl]", className)}>
        אין מילים תואמות לסינון / חיפוש.
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 [direction:rtl] [text-align:start]", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="sr-only" htmlFor="vocab-search">
          חיפוש מילים
        </label>
        <input
          id="vocab-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setStart(0);
          }}
          placeholder="חיפוש (אנגלית או עברית)…"
          className="min-h-11 w-full max-w-md rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-base text-[#0f2347] shadow-sm placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">כרטיסים במסך:</span>
          {([1, 2, 3] as const).map((n) => (
            <Button
              key={n}
              type="button"
              variant={perView === n ? "primary" : "ghost"}
              className="!h-9 !min-w-9 !px-2"
              onClick={() => onPerView(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3",
          perView === 1 && "grid-cols-1",
          perView === 2 && "md:grid-cols-2",
          perView === 3 && "md:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {visible.map((w) => (
          <WordCard key={w.id} word={w} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100/90 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={goPrev} disabled={safeStart <= 0}>
            הקודם
          </Button>
          <Button type="button" variant="secondary" onClick={goNext} disabled={safeStart >= maxStart}>
            הבא
          </Button>
        </div>
        <p className="text-sm tabular-nums text-slate-600">
          {safeStart + 1}–{Math.min(safeStart + perView, total)} מתוך {total}
        </p>
      </div>

      <details className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[#0f2347] marker:content-none [&::-webkit-details-marker]:hidden">
          הצגת רשימת כל המילים ({total})
        </summary>
        <div className="max-h-56 overflow-y-auto border-t border-stone-100/90 px-3 py-2 text-sm leading-7 text-slate-700">
          <ul className="columns-2 gap-x-6 sm:columns-3">
            {filtered.map((w) => (
              <li key={w.id} className="break-inside-avoid py-0.5 [direction:ltr] [text-align:start]" lang="en">
                <span className="font-medium text-[#0f2347]">{w.word}</span>
                <span className="text-slate-400"> · </span>
                <span className="text-slate-600" dir="rtl" lang="he">
                  {w.translation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
