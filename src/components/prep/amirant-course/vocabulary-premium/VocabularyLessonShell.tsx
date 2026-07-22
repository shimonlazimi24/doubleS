"use client";

import { useCallback, useState } from "react";
import type { DeckMetrics } from "./WordLearningDeck";
import type { VocabularyLessonModel } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { VocabularyCategoryGrid } from "./VocabularyCategoryGrid";
import { VocabularyPackageOverview } from "./VocabularyPackageOverview";
import { WordLearningDeck } from "./WordLearningDeck";

export type VocabularyLessonShellProps = {
  model: VocabularyLessonModel;
  className?: string;
};

/**
 * משטח "למידה" flashcard-first: מבנה חבילה (אם קיים), שורת פילטרים + חיפוש רזה,
 * וכרטיס מילה אחד במוקד. המטא (רמה/מילים/זמן) מוצג ע"י ההורה מתחת לטאבים.
 */
export function VocabularyLessonShell({ model, className }: VocabularyLessonShellProps) {
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [, setDeckMetrics] = useState<DeckMetrics>({
    start: 0,
    perView: 1,
    filteredTotal: model.words.length,
  });

  const onDeckMetrics = useCallback((m: DeckMetrics) => {
    setDeckMetrics(m);
  }, []);

  return (
    <div className={cn("space-y-4 [direction:rtl] [text-align:start]", className)}>
      {model.packageStats.length > 0 ? (
        <section aria-labelledby="vocab-package-heading">
          <h3 id="vocab-package-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-900/85">
            מבנה החבילה
          </h3>
          <VocabularyPackageOverview rows={model.packageStats} />
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <VocabularyCategoryGrid
          categories={model.categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          className="min-w-0"
        />
        <label className="sr-only" htmlFor="vocab-search">
          חיפוש מילים
        </label>
        <input
          id="vocab-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש (אנגלית או עברית)…"
          className="h-10 w-full max-w-sm rounded-full border border-line/80 bg-white px-4 text-sm text-[#0f2347] placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-72"
        />
      </div>

      <section aria-label="לימוד מילים">
        <WordLearningDeck
          words={model.words}
          categoryFilter={categoryId}
          query={query}
          onDeckMetrics={onDeckMetrics}
        />
      </section>
    </div>
  );
}
