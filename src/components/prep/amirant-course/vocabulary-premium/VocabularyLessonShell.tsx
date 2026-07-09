"use client";

import { useCallback, useState } from "react";
import type { DeckMetrics } from "./WordLearningDeck";
import type { VocabularyLessonModel, VocabularyLevel } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { VocabularyCategoryGrid } from "./VocabularyCategoryGrid";
import { VocabularyPackageOverview } from "./VocabularyPackageOverview";
import { WordLearningDeck } from "./WordLearningDeck";

const LEVEL_HE: Record<VocabularyLevel, string> = {
  easy: "קל",
  intermediate: "בינוני",
  advanced: "מתקדמים",
  expert: "מומחה",
};

export type VocabularyLessonShellProps = {
  lessonTitle: string;
  model: VocabularyLessonModel;
  estimatedMinutes: number | null;
  className?: string;
};

/**
 * Premium vocabulary “למידה” surface: overview, package stats, category filters, word deck (no raw MD).
 */
export function VocabularyLessonShell({ lessonTitle, model, estimatedMinutes, className }: VocabularyLessonShellProps) {
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [deckMetrics, setDeckMetrics] = useState<DeckMetrics>({
    start: 0,
    perView: 1,
    filteredTotal: model.words.length,
  });

  const onDeckMetrics = useCallback((m: DeckMetrics) => {
    setDeckMetrics(m);
  }, []);

  const levelHe = LEVEL_HE[model.level];

  return (
    <div className={cn("space-y-5 [direction:rtl] [text-align:start]", className)}>
      <header className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_2px_rgba(15,35,71,0.05)] sm:p-4">
        <h2 className="sr-only">פרטי החבילה</h2>
        <p className="sr-only">
          {lessonTitle}. רמה {levelHe}, {model.wordCount} מילים
          {estimatedMinutes != null ? `, כ-${estimatedMinutes} דקות` : ""}.
        </p>
        <div className="flex flex-wrap items-center justify-start gap-2">
          <span className="rounded-full border border-sky-200/80 bg-sky-50/60 px-3 py-1 text-sm font-semibold text-sky-950/90">
            רמה: {levelHe}
          </span>
          <span className="rounded-full border border-stone-200/90 bg-stone-50 px-3 py-1 text-sm font-medium text-slate-700">
            {model.wordCount} מילים
          </span>
          <span className="rounded-full border border-stone-200/90 bg-stone-50 px-3 py-1 text-sm font-medium text-slate-700">
            {estimatedMinutes != null ? `~${estimatedMinutes} דק׳` : "זמן משוער -"}
          </span>
        </div>
      </header>

      <section aria-labelledby="vocab-package-heading">
        <h3 id="vocab-package-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-900/85">
          מבנה החבילה
        </h3>
        <VocabularyPackageOverview rows={model.packageStats} fallback={{ wordCount: model.wordCount }} />
      </section>

      <VocabularyCategoryGrid categories={model.categories} selectedId={categoryId} onSelect={setCategoryId} />

      <section aria-labelledby="vocab-deck-heading">
        <h3 id="vocab-deck-heading" className="mb-3 text-lg font-semibold text-[#0f2347]">
          לימוד מילים
        </h3>
        <WordLearningDeck
          words={model.words}
          categoryFilter={categoryId}
          onDeckMetrics={onDeckMetrics}
        />
      </section>
    </div>
  );
}
