"use client";

import type { VocabularyWord } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { WordCardTabs } from "./WordCardTabs";
import { WordExampleBlock } from "./WordExampleBlock";
import { WordMemoryTip } from "./WordMemoryTip";

export type WordCardProps = {
  word: VocabularyWord;
  className?: string;
};

/**
 * Premium word surface: large EN headword, POS, visible translation, tabbed detail.
 */
export function WordCard({ word, className }: WordCardProps) {
  const posDisplay = word.partOfSpeech && word.partOfSpeech !== "—" ? word.partOfSpeech : "";
  const showEx = word.examples.length > 0;
  const hasSyn = Boolean(word.synonyms?.length);
  const hasAnt = Boolean(word.antonyms?.length);
  const showExtra = hasSyn || hasAnt || Boolean(word.memoryTip?.trim());

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,35,71,0.06)]",
        className,
      )}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <header className="[direction:ltr] [text-align:start]" lang="en" translate="no">
          <div className="flex flex-wrap items-end gap-2">
            <h3 className="text-4xl font-semibold tracking-tight text-[#0f2347]">{word.word}</h3>
            {posDisplay ? (
              <span className="mb-1 rounded-full border border-slate-200/90 bg-stone-50 px-2.5 py-0.5 text-sm font-medium text-slate-600">
                {posDisplay}
              </span>
            ) : null}
          </div>
        </header>

        <div className="border-b border-stone-100/90 pb-3 [direction:rtl] [text-align:start]">
          <p className="text-sm font-medium text-slate-500">תרגום</p>
          <p className="mt-0.5 text-lg font-medium leading-8 text-[#0f2347] [text-wrap:pretty]">{word.translation}</p>
        </div>

        <WordCardTabs
          showExamples={showEx}
          showExtra={showExtra}
          panels={{
            meaning: (
              <div className="space-y-3 [text-align:start]">
                {word.definition ? (
                  <div className="[direction:ltr]" lang="en">
                    <p className="text-sm font-medium text-slate-500">Definition</p>
                    <p className="mt-1 text-base leading-8 text-slate-800 [text-wrap:pretty]">{word.definition}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">אין הגדרה נפרדת — עברו לדוגמאות.</p>
                )}
              </div>
            ),
            examples: (
              <div className="space-y-2">
                {word.examples.map((ex, i) => (
                  <WordExampleBlock key={i} text={ex} index={i} />
                ))}
              </div>
            ),
            extra: (
              <div className="space-y-4 [text-align:start]">
                {hasSyn ? (
                  <div className="[direction:rtl]">
                    <p className="text-sm font-medium text-slate-500">מילים נרדפות</p>
                    <p className="mt-1 text-base leading-7 text-slate-800 [direction:ltr] [text-align:start]" lang="en">
                      {word.synonyms?.join(", ")}
                    </p>
                  </div>
                ) : null}
                {hasAnt ? (
                  <div>
                    <p className="text-sm font-medium text-slate-500">הפכים</p>
                    <p className="mt-1 text-base leading-7 text-slate-800 [direction:ltr] [text-align:start]" lang="en">
                      {word.antonyms?.join(", ")}
                    </p>
                  </div>
                ) : null}
                {word.memoryTip ? <WordMemoryTip text={word.memoryTip} /> : null}
              </div>
            ),
          }}
        />
      </div>
    </article>
  );
}
