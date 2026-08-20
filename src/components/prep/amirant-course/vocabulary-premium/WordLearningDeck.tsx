"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VocabularyWord } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { WordCard } from "./WordCard";
import {
  isVocabCardDue,
  loadVocabSrsDeck,
  rateVocabCard,
  saveVocabSrsDeck,
  type VocabSrsDeck,
  type VocabSrsRating,
} from "@/lib/amirant-course/vocabulary/srs-storage";

export type DeckMetrics = { start: number; perView: number; filteredTotal: number };

export type WordLearningDeckProps = {
  words: VocabularyWord[];
  categoryFilter: string | "all";
  lessonId: string;
  /** מצב חזרה: רק מילים שמועד החזרה שלהן הגיע */
  dueOnly?: boolean;
  /** חיפוש חופשי - השדה עצמו יושב בשורת הפילטרים של ה-Shell */
  query?: string;
  /** Fired when navigation or filter changes - for lesson progress UI. */
  onDeckMetrics?: (m: DeckMetrics) => void;
  className?: string;
};

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/** ניווט מילים — קל ומשני, כדי שלא יתחרה ב«המשך השיעור» בפוטר */
const wordNavButtonClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-transparent bg-stone-100/90 px-3 text-sm font-medium text-slate-700 transition hover:bg-stone-200/90 hover:text-[#0f2347] disabled:pointer-events-none disabled:opacity-35";

/**
 * Flashcard-first: מילה אחת במוקד, ניווט קומפקטי צמוד לכרטיס (נבדל מניווט
 * השיעור בפוטר הדביק), ורשימת כל המילים כקישור טקסט קטן.
 */
export function WordLearningDeck({
  words,
  categoryFilter,
  lessonId,
  dueOnly = false,
  query = "",
  onDeckMetrics,
  className,
}: WordLearningDeckProps) {
  const [start, setStart] = useState(0);
  const [srs, setSrs] = useState<VocabSrsDeck>({});

  useEffect(() => {
    setSrs(loadVocabSrsDeck(lessonId));
  }, [lessonId]);

  const filtered = useMemo(() => {
    const q = normalizeQuery(query);
    return words.filter((w) => {
      if (categoryFilter !== "all" && w.categoryId !== categoryFilter) return false;
      if (dueOnly && !isVocabCardDue(srs[w.id])) return false;
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q)
      );
    });
  }, [words, categoryFilter, query, dueOnly, srs]);

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

  const rateCurrent = useCallback(
    (rating: VocabSrsRating) => {
      if (!current) return;
      const nextDeck = { ...srs, [current.id]: rateVocabCard(srs[current.id], rating) };
      setSrs(nextDeck);
      saveVocabSrsDeck(lessonId, nextDeck);
      if (dueOnly) {
        setStart((s) => Math.min(s, Math.max(0, total - 2)));
      } else {
        setStart((s) => Math.min(maxStart, s + 1));
      }
    },
    [current, dueOnly, lessonId, maxStart, srs, total],
  );

  if (total === 0 || !current) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-slate-200/90 bg-stone-50/40 p-6 text-center text-slate-600 [direction:rtl]", className)}>
        {dueOnly ? "אין מילים לחזרה עכשיו. המשיכו בלמידה, או חזרו מחר." : "אין מילים תואמות לסינון / חיפוש."}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 [direction:rtl] [text-align:start]", className)}>
      <WordCard word={current} />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="min-h-10 rounded-lg bg-rose-50 px-3 text-sm font-medium text-rose-800 hover:bg-rose-100"
          onClick={() => rateCurrent("again")}
        >
          שוב
        </button>
        <button
          type="button"
          className="min-h-10 rounded-lg bg-amber-50 px-3 text-sm font-medium text-amber-900 hover:bg-amber-100"
          onClick={() => rateCurrent("hard")}
        >
          קשה
        </button>
        <button
          type="button"
          className="min-h-10 rounded-lg bg-emerald-50 px-3 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          onClick={() => rateCurrent("good")}
        >
          יודע/ת
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-400">שוב = היום · קשה = בקרוב · יודע/ת = חזרה מרווחת</p>

      <nav
        className="rounded-xl border border-stone-200/70 bg-stone-50/50 px-3 py-2.5"
        aria-label="ניווט בין מילים ברשימה"
      >
        <p className="mb-2 text-center text-xs font-medium text-slate-500">
          ברשימת המילים · {safeStart + 1} מתוך {total}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className={wordNavButtonClass} onClick={goPrev} disabled={safeStart <= 0}>

            המילה הקודמת
          </button>
          <button type="button" className={wordNavButtonClass} onClick={goNext} disabled={safeStart >= maxStart}>
            המילה הבאה

          </button>
        </div>
        <p className="mt-2 text-center text-[11px] leading-snug text-slate-400">
          להמשך השיעור (שקופית הבאה) — הכפתור הכחול למטה
        </p>
      </nav>

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
