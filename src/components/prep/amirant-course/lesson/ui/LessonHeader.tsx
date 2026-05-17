import { cn } from "@/lib/design-system/cn";
import { lessonSaaS } from "./lesson-saas-tokens";

type Props = {
  kindLabel: string;
  title: string;
  totalSteps: number;
  activeIndex: number;
  progressPercent: number;
  /** When true, width transition is disabled (accessibility). */
  reducedMotion?: boolean;
  className?: string;
};

/**
 * Title + inline step progress: minimal track under H1; no card, no course-level %.
 */
export function LessonHeader({
  kindLabel,
  title,
  totalSteps,
  activeIndex,
  progressPercent,
  reducedMotion = false,
  className,
}: Props) {
  const p = Math.max(0, Math.min(100, progressPercent));
  const current = totalSteps > 0 ? Math.min(activeIndex + 1, totalSteps) : 0;
  const showBar = totalSteps > 0;

  return (
    <header className={cn("w-full [direction:rtl] [text-align:start]", className)} lang="he">
      <p className={lessonSaaS.eyebrow}>שיעור · {kindLabel}</p>
      <div className="mt-1 space-y-1.5 sm:mt-1.5">
        <h1 className="text-3xl font-semibold leading-tight text-[#0f2347] [text-wrap:balance] sm:text-4xl">{title}</h1>
        {showBar ? (
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className="shrink-0 tabular-nums text-xs text-slate-500" aria-live="polite">
              {current}/{totalSteps}
            </span>
            <div className="min-w-0 flex-1" dir="rtl">
              <div
                className="h-1 overflow-hidden rounded-full bg-slate-200/90"
                role="progressbar"
                aria-valuenow={p}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="התקדמות בשיעור (שלבים)"
              >
                <div
                  className={cn(
                    "h-full bg-sky-500/90",
                    !reducedMotion && "transition-[width] duration-300 ease-out",
                  )}
                  style={{ width: `${p}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
