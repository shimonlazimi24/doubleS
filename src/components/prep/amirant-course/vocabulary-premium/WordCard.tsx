"use client";

import type { VocabularyWord } from "@/lib/amirant-course/vocabulary/vocabulary-word-model";
import { cn } from "@/lib/design-system/cn";
import { WordExampleBlock } from "./WordExampleBlock";
import { WordMemoryTip } from "./WordMemoryTip";

export type WordCardProps = {
  word: VocabularyWord;
  className?: string;
};

/**
 * כרטיס מילה במוקד אחד: מילה + POS, תרגום בולט, הגדרה, דוגמאות והרחבות בערימה
 * אחת - בלי טאבים פנימיים (flashcard-first, כל המידע גלוי מיד).
 */
export function WordCard({ word, className }: WordCardProps) {
  const posDisplay = word.partOfSpeech && word.partOfSpeech !== "-" ? word.partOfSpeech : "";
  const hasSyn = Boolean(word.synonyms?.length);
  const hasAnt = Boolean(word.antonyms?.length);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_8px_rgba(15,35,71,0.06)]",
        className,
      )}
    >
      <div className="space-y-4 p-4 sm:p-6">
        <header className="border-b border-stone-100/90 pb-3 [direction:ltr] [text-align:start]" lang="en" translate="no">
          <div className="flex flex-wrap items-end gap-2">
            <h3 className="text-3xl font-semibold tracking-tight text-[#0f2347] sm:text-4xl">{word.word}</h3>
            {posDisplay ? (
              <span className="mb-1 rounded-full border border-slate-200/90 bg-stone-50 px-2.5 py-0.5 text-sm font-medium text-slate-600">
                {posDisplay}
              </span>
            ) : null}
          </div>
        </header>

        <div className="[direction:rtl] [text-align:start]">
          <p className="text-sm font-medium text-slate-500">תרגום</p>
          <p className="mt-0.5 text-xl font-semibold leading-8 text-[#0f2347] [text-wrap:pretty]">{word.translation}</p>
        </div>

        {word.definition ? (
          <div className="[direction:ltr] [text-align:start]" lang="en">
            <p className="text-sm font-medium text-slate-500">Definition</p>
            <p className="mt-0.5 text-base leading-7 text-slate-800 [text-wrap:pretty]">{word.definition}</p>
          </div>
        ) : null}

        {word.examples.length > 0 ? (
          <div className="[direction:rtl] [text-align:start]">
            <p className="text-sm font-medium text-slate-500">דוגמאות</p>
            <div className="mt-1.5 space-y-2">
              {word.examples.map((ex, i) => (
                <WordExampleBlock key={i} text={ex} index={i} />
              ))}
            </div>
          </div>
        ) : null}

        {hasSyn || hasAnt ? (
          <div className="space-y-3 [direction:rtl] [text-align:start]">
            {hasSyn ? (
              <div>
                <p className="text-sm font-medium text-slate-500">מילים נרדפות</p>
                <p className="mt-0.5 text-base leading-7 text-slate-800 [direction:ltr] [text-align:start]" lang="en">
                  {word.synonyms?.join(", ")}
                </p>
              </div>
            ) : null}
            {hasAnt ? (
              <div>
                <p className="text-sm font-medium text-slate-500">הפכים</p>
                <p className="mt-0.5 text-base leading-7 text-slate-800 [direction:ltr] [text-align:start]" lang="en">
                  {word.antonyms?.join(", ")}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {word.memoryTip ? <WordMemoryTip text={word.memoryTip} /> : null}
      </div>
    </article>
  );
}
