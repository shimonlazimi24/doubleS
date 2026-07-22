"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabularyWord } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { WordCard } from "./WordCard";

export type DeckMetrics = { start: number; perView: number; filteredTotal: number };

export type WordLearningDeckProps = {
  words: VocabularyWord[];
  categoryFilter: string | "all";
  /** חיפוש חופשי - השדה עצמו יושב בשורת הפילטרים של ה-Shell */
  query?: string;
  /** Fired when navigation or filter changes - for lesson progress UI. */
  onDeckMetrics?: (m: DeckMetrics) => void;
  className?: string;
};

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

const navButtonClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line/80 bg-white px-3.5 text-sm font-medium text-[#0f2347] transition hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40";

/**
 * Flashcard-first: מילה אחת במוקד, ניווט קומפקטי צמוד לכרטיס (נבדל מניווט
 * השיעור בפוטר הדביק), ורשימת כל המילים כקישור טקסט קטן.
 */
export function WordLearningDeck({ words, categoryFilter, query = "", onDeckMetrics, className }: WordLearningDeckProps) {
  const [start, setStart] = useState(0);

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
  const maxStart = Math.max(0, total - 1);
  const safeStart = Math.min(start, maxStart);
  const current = filtered[safeStart] ?? null;

  useEffect(() => {
    setStart(0);
  }, [query]);

  useEffect(() => {
    onDeckMetrics?.({ start: safeStart, perView: 1, filteredTotal: total });
  }, [safeStart, total, onDeckMetrics]);

  const goPrev = useCallback(() => {
    setStart((s) => Math.max(0, s - 1));
  }, []);

  const goNext = useCallback(() => {
    setStart((s) => Math.min(maxStart, s + 1));
  }, [maxStart]);

  if (total === 0 || !current) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-slate-200/90 bg-stone-50/40 p-6 text-center text-slate-600 [direction:rtl]", className)}>
        אין מילים תואמות לסינון / חיפוש.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 [direction:rtl] [text-align:start]", className)}>
      <WordCard word={current} />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className={navButtonClass} onClick={goPrev} disabled={safeStart <= 0}>
          <span aria-hidden>→</span>
          הקודמת
        </button>
        <p className="min-w-[6.5rem] text-center text-sm tabular-nums text-slate-600">
          {safeStart + 1} מתוך {total}
        </p>
        <button type="button" className={navButtonClass} onClick={goNext} disabled={safeStart >= maxStart}>
          המילה הבאה
          <span aria-hidden>←</span>
        </button>
      </div>

      <details className="text-center">
        <summary className="inline-flex cursor-pointer list-none items-center text-sm font-medium text-primary underline-offset-4 marker:content-none hover:underline [&::-webkit-details-marker]:hidden">
          הצגת רשימת כל המילים ({total})
        </summary>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-line/60 bg-white px-3 py-2 text-sm leading-7 text-slate-700 [text-align:start]">
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
