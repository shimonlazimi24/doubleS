import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system/cn";

type Props = {
  title: string;
  intro: string;
  defaultIntroFallback: string;
  estimatedMinutes: number | null;
  showFlowControls: boolean;
  started: boolean;
  viewAll: boolean;
  onStart: () => void;
  onToggleViewAll: () => void;
  className?: string;
  /** `workspace` = one reading surface; no inner card. */
  surface?: "card" | "workspace";
  /** When the page already shows the lesson title (e.g. LessonHeader), skip the inner H2. */
  omitTitle?: boolean;
};

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/**
 * First content card: short intro + primary CTA - all on white, calm premium course style.
 */
export function LessonHeroCard({
  title,
  intro,
  defaultIntroFallback,
  estimatedMinutes,
  showFlowControls,
  started,
  viewAll,
  onStart,
  onToggleViewAll,
  className,
  surface = "card",
  omitTitle = false,
}: Props) {
  const blurb = (intro || defaultIntroFallback).trim();
  const shell =
    surface === "workspace"
      ? "bg-transparent p-0 [direction:rtl] [text-align:start] shadow-none"
      : "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8";
  return (
    <div className={cn(shell, className)} lang="he">
      {omitTitle ? <span className="sr-only">{title}</span> : null}
      {!omitTitle ? (
        <h2
          className={cn(
            "font-semibold leading-tight text-gray-900 [text-wrap:balance]",
            surface === "workspace" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
          )}
        >
          {title}
        </h2>
      ) : null}
      {/* משך משוער הוא מטא-דאטה, לא פעולה: שורת טקסט שקטה במקום תג ממוסגר */}
      {estimatedMinutes != null ? (
        <p
          className={cn(
            "inline-flex items-center gap-1.5 text-gray-500",
            omitTitle ? "mt-0" : "mt-2",
            surface === "workspace" ? "text-sm" : "text-xs",
          )}
        >
          <ClockIcon className="h-3.5 w-3.5 shrink-0" />
          {`כ־${estimatedMinutes} דק׳`}
        </p>
      ) : null}
      <p
        className={cn(
          "max-w-none text-gray-600 [text-wrap:pretty]",
          omitTitle ? "mt-3" : "mt-4",
          surface === "workspace" ? "text-base leading-relaxed sm:text-lg" : "line-clamp-3 max-w-2xl text-sm sm:text-base sm:line-clamp-3",
        )}
        title={surface === "card" && blurb.length > 80 ? blurb : undefined}
      >
        {blurb}
      </p>
      {showFlowControls ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {!started ? (
            <Button
              type="button"
              variant="primary"
              className="min-w-[7rem] rounded-xl px-6 py-2.5 text-sm font-medium shadow-sm"
              onClick={onStart}
            >
              התחל
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl border border-gray-200 bg-white text-sm text-gray-800 shadow-sm"
            onClick={onToggleViewAll}
          >
            {viewAll ? "מצב שלב-אחר-שלב" : "הצג הכל"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
