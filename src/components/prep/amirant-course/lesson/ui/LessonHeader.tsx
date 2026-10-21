import { cn } from "@/lib/design-system/cn";
import { getModuleByLessonId } from "@/lib/amirant-course/navigation";
import { splitLessonTitle } from "@/lib/amirant-course/lesson-content/module-lesson-groups";

type Props = {
  lessonId: string;
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
 * Where the learner is, in one line, then the title and the step progress.
 * The line above the title names the module and, for a practice unit, its
 * level; the old "שיעור · קריאה" label called every unit a reading lesson.
 */
export function LessonHeader({
  lessonId,
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
  const moduleTitle = getModuleByLessonId(lessonId)?.module.title ?? null;
  const { name, level } = splitLessonTitle(title);
  const context = [moduleTitle, level ?? (moduleTitle ? null : kindLabel)].filter(Boolean).join(" · ");

  return (
    <header className={cn("w-full [direction:rtl] [text-align:start]", className)} lang="he">
      {context ? <p className="text-[13px] text-muted">{context}</p> : null}
      <div className="mt-1 space-y-2">
        <h1 className="text-2xl font-extrabold leading-tight text-ink [text-wrap:balance] sm:text-3xl">{name}</h1>
        {showBar ? (
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-xs tabular-nums text-muted" aria-live="polite">
              {current} מתוך {totalSteps}
            </span>
            <div className="min-w-0 max-w-[14rem] flex-1" dir="rtl">
              <div
                className="h-1 overflow-hidden bg-surface-high"
                role="progressbar"
                aria-valuenow={p}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="התקדמות בשיעור (שלבים)"
              >
                <div
                  className={cn("h-full bg-primary", !reducedMotion && "transition-[width] duration-300 ease-out")}
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
