"use client";

/**
 * קטע קריאה לשאלת הבנת הנקרא - לכל ממשקי החידונים.
 * כל שאלות ה-RC בבנק האמיתי תלויות-קטע (passageId); בלי הפאנל הזה השאלה
 * ("What is the main idea of the passage?") אינה ניתנת למענה.
 */
import { getClientPassage } from "@/lib/amirant-course/question-bank/client-bank";
import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import { cn } from "@/lib/design-system/cn";

export function QuizPassagePanel({ passageId, className }: { passageId?: string; className?: string }) {
  if (!passageId) return null;
  const passage = getClientPassage(passageId);
  if (!passage) return null;
  return (
    <div
      dir="ltr"
      className={cn(
        "max-h-72 overflow-y-auto rounded-xl border border-line/70 bg-surface-low p-4",
        className,
      )}
    >
      {passage.title ? <p className="mb-2 text-sm font-semibold text-ink">{passage.title}</p> : null}
      <PremiumMarkdownBody body={passage.bodyMarkdown} variant="card" className="[direction:ltr] [&_*]:!text-start" />
    </div>
  );
}
