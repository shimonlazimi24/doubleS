"use client";

import type { VocabularyCategory } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { VocabularyCategoryCard } from "./VocabularyCategoryCard";

export type VocabularyCategoryGridProps = {
  categories: VocabularyCategory[];
  selectedId: string | "all";
  onSelect: (id: string | "all") => void;
  className?: string;
};

export function VocabularyCategoryGrid({ categories, selectedId, onSelect, className }: VocabularyCategoryGridProps) {
  if (categories.length <= 1) return null;

  return (
    <div className={cn("space-y-2 [direction:rtl] [text-align:start]", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/85">סינון לפי קטגוריה</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <VocabularyCategoryCard
          title="הכל"
          count={categories.reduce((s, c) => s + c.count, 0)}
          selected={selectedId === "all"}
          onSelect={() => onSelect("all")}
        />
        {categories.map((c) => (
          <VocabularyCategoryCard
            key={c.id}
            title={c.title}
            count={c.count}
            selected={selectedId === c.id}
            onSelect={() => onSelect(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
