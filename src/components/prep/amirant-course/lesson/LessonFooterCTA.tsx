import Link from "next/link";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

type Props = {
  courseHomeHref: string;
  practiceHref: string | null;
  quizHref: string | null;
  nextLessonHref: string | null;
  nextLessonTitle: string | null;
  className?: string;
  /** Use on lesson workspace main column (no second card). */
  surface?: "card" | "embed";
  /** מציג את "המשך לשיעור הבא" ככפתור ראשי מלא, ראשון בסדר. */
  emphasizeNext?: boolean;
};

export function LessonFooterCTA({
  courseHomeHref,
  practiceHref,
  quizHref,
  nextLessonHref,
  nextLessonTitle,
  className,
  surface = "card",
  emphasizeNext = false,
}: Props) {
  const nextLessonLink =
    nextLessonHref && nextLessonTitle ? (
      <Link
        href={nextLessonHref}
        className={cn(
          "inline-flex min-h-[2.75rem] flex-col items-stretch justify-center gap-0.5 rounded-xl px-5 py-2.5 text-start text-sm transition",
          emphasizeNext
            ? "bg-ink/90 text-white shadow-sm hover:bg-ink"
            : "border border-gray-200 bg-white text-gray-900 hover:border-primary/35 hover:text-primary",
        )}
      >
        <span className="font-medium">המשך לשיעור הבא</span>
        <span className={cn("text-xs font-normal", emphasizeNext ? "text-white/70" : "text-muted")}>
          {nextLessonTitle}
        </span>
      </Link>
    ) : null;
  const shell =
    surface === "embed"
      ? "border-0 border-t border-gray-200/80 bg-transparent p-0 pt-6 shadow-none [direction:rtl] [text-align:start] sm:pt-8"
      : "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8";
  return (
    <div className={cn(shell, className)} lang="he">
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">השלבים הבאים</h2>
      <p className="mt-2 text-base text-gray-600 sm:mt-3 sm:text-lg">תרגול או שיעור הבא - אפשר לבחור לפי הזמן הזמין.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {emphasizeNext ? nextLessonLink : null}
        {practiceHref ? (
          <Link
            href={practiceHref}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-primary/30 bg-white px-5 text-sm font-medium text-primary shadow-sm transition hover:border-primary/45 hover:bg-primary/[0.04]"
          >
            עבור לתרגול
          </Link>
        ) : null}
        {quizHref ? (
          <Link
            href={quizHref}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-gray-200 bg-ink/90 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-ink"
          >
            מבחן קצר
          </Link>
        ) : null}
        {!emphasizeNext ? nextLessonLink : null}
        {!practiceHref && !quizHref && !nextLessonHref ? (
          <Text as="p" variant="bodySm" className="text-muted">
            אין עדיין קישורי תרגול או בוחן מצורפים לשיעור זה.
          </Text>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-muted">
        <Link className="font-medium text-primary underline-offset-2 hover:underline" href={courseHomeHref}>
          חזרה לתוכנית הקורס
        </Link>
      </p>
    </div>
  );
}
