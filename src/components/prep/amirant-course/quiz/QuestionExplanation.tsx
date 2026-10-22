"use client";

import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import { splitExplanation } from "@/lib/amirant-course/lesson-content/split-explanation";
import { cn } from "@/lib/design-system/cn";

/**
 * A graded question's explanation: the short one open, the full explanation and
 * the distractor analysis behind two plain disclosures. A learner who got it
 * right reads two lines; one who wants the method opens it.
 */
export function QuestionExplanation({ markdown, isCorrect, className }: { markdown: string; isCorrect: boolean; className?: string }) {
  const parts = splitExplanation(markdown);
  return (
    <div
      className={cn("mt-4 border-s-2 ps-4", isCorrect ? "border-emerald-600/70" : "border-amber-500/80", className)}
      dir="rtl"
    >
      <p className={cn("mb-1.5 text-[11px] font-bold tracking-wide", isCorrect ? "text-emerald-700" : "text-amber-700")}>
        {isCorrect ? "נכון" : "הסבר"}
      </p>
      <PremiumMarkdownBody body={parts.short} variant="card" />
      {parts.full ? (
        <details className="group mt-3 border-t border-line/70 pt-2">
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">הסבר מלא והשיטה</span>
            <span className="hidden group-open:inline">סגירת ההסבר המלא</span>
          </summary>
          <div className="mt-2">
            <PremiumMarkdownBody body={parts.full} variant="card" />
          </div>
        </details>
      ) : null}
      {parts.whyNot ? (
        <details className="group mt-2 border-t border-line/70 pt-2">
          <summary className="cursor-pointer list-none text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">למה לא האפשרויות האחרות</span>
            <span className="hidden group-open:inline">סגירה</span>
          </summary>
          <div className="mt-2">
            <PremiumMarkdownBody body={parts.whyNot} variant="card" />
          </div>
        </details>
      ) : null}
    </div>
  );
}
