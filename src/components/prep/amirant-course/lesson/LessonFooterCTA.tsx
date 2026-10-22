import Link from "next/link";
import { cn } from "@/lib/design-system/cn";
import { splitLessonTitle } from "@/lib/amirant-course/lesson-content/module-lesson-groups";

type Props = {
  courseHomeHref: string;
  practiceHref: string | null;
  quizHref: string | null;
  nextLessonHref: string | null;
  nextLessonTitle: string | null;
  className?: string;
  /**
   * "embed": under a summary that already has its own heading.
   * "closing": the lesson's last step; carries its own heading.
   * "card": standalone on a page.
   */
  surface?: "card" | "embed" | "closing";
  /** The next lesson is the primary action; practice and quiz become secondary links. */
  emphasizeNext?: boolean;
};

const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-sm font-semibold text-white transition hover:opacity-90";
const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-paper px-5 text-sm font-medium text-ink transition hover:border-primary/40 hover:text-primary";
const quietLink = "text-sm font-medium text-primary underline-offset-2 hover:underline";

/**
 * The lesson's closing actions. One primary button leads to the next unit,
 * everything else is a secondary button or a plain link: no second heading,
 * no card inside the step.
 */
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
  const next = nextLessonTitle ? splitLessonTitle(nextLessonTitle) : null;
  const nextLabel = next ? (next.level ? `${next.name} · ${next.level}` : next.name) : null;
  const hasNext = Boolean(nextLessonHref && nextLabel);
  const nextIsPrimary = hasNext && (emphasizeNext || (!practiceHref && !quizHref));

  const shell =
    surface === "card"
      ? "rounded-surface border border-line bg-paper p-6 sm:p-8"
      : surface === "closing"
        ? "py-2"
        : "";

  return (
    <div className={cn(shell, "[direction:rtl] [text-align:start]", className)} lang="he">
      {surface === "closing" ? (
        <>
          <h2 className="text-2xl font-semibold text-ink sm:text-3xl">סיימתם את השיעור</h2>
          <p className="mt-2 text-base text-muted">
            {hasNext ? "ממשיכים ליחידה הבאה, או חוזרים לתוכנית הקורס." : "חזרו לתוכנית הקורס לבחירת היחידה הבאה."}
          </p>
        </>
      ) : null}
      <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", surface === "closing" ? "mt-6" : "")}>
        {hasNext ? (
          <Link href={nextLessonHref!} className={nextIsPrimary ? primaryBtn : secondaryBtn}>
            <span>הבא: {nextLabel}</span>
            <span aria-hidden>←</span>
          </Link>
        ) : null}
        {practiceHref ? (
          <Link href={practiceHref} className={nextIsPrimary ? secondaryBtn : primaryBtn}>
            תרגול
          </Link>
        ) : null}
        {quizHref ? (
          <Link href={quizHref} className={secondaryBtn}>
            מבחן קצר
          </Link>
        ) : null}
        <Link href={courseHomeHref} className={cn(quietLink, "sm:ms-2")}>
          תוכנית הקורס
        </Link>
      </div>
    </div>
  );
}
