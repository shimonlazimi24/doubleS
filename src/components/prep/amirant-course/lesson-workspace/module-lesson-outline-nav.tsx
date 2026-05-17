/**
 * Module-level lesson list (e.g. for a module hub page). Not mounted on `/course/lesson/[lessonId]`
 * — lesson pages use `CourseOutlineSidebar` (current module only) as the only right rail.
 */
import Link from "next/link";
import { cn } from "@/lib/design-system/cn";

export type ModuleLessonOutlineItem = {
  id: string;
  title: string;
  href: string;
};

export type ModuleLessonOutline = {
  /** Hebrew label for the module (e.g. syllabus title). */
  moduleTitleHe: string;
  currentLessonId: string;
  lessons: ModuleLessonOutlineItem[];
};

type Props = {
  outline: ModuleLessonOutline;
  /** Sidebar = vertical list; mobile = horizontal chip strip. */
  variant: "sidebar" | "mobile";
  className?: string;
};

/**
 * Lists all lessons in the current module so learners see the full chapter (e.g. «מפת הדרכים» as its own lesson).
 */
export function ModuleLessonOutlineNav({ outline, variant, className }: Props) {
  const { moduleTitleHe, currentLessonId, lessons } = outline;
  if (lessons.length <= 1) return null;

  if (variant === "mobile") {
    return (
      <div className={cn("border-t border-stone-200/80 pt-3 [direction:rtl] [text-align:start]", className)} lang="he">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">שיעורים במודול</p>
        <p className="mt-1 text-xs font-medium text-[#0f2347]/90">{moduleTitleHe}</p>
        <div
          className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]"
          role="list"
          aria-label="שיעורים במודול"
        >
          {lessons.map((l, i) => {
            const here = l.id === currentLessonId;
            return (
              <div key={l.id} role="listitem" className="shrink-0">
                {here ? (
                  <span
                    className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-sky-800/35 bg-sky-50/90 px-2.5 py-1.5 text-xs font-semibold text-sky-950 shadow-sm"
                    title={l.title}
                  >
                    <span className="tabular-nums text-[10px] text-sky-800/90">{i + 1}</span>
                    <span className="min-w-0 [overflow-wrap:anywhere] [text-wrap:balance]">{l.title}</span>
                  </span>
                ) : (
                  <Link
                    href={l.href}
                    className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-sky-800/25 hover:bg-stone-50/80"
                    title={l.title}
                  >
                    <span className="tabular-nums text-[10px] text-slate-500">{i + 1}</span>
                    <span className="min-w-0 [overflow-wrap:anywhere] [text-wrap:balance]">{l.title}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mt-3 border-t border-stone-200/80 pt-3 [direction:rtl] [text-align:start]", className)} lang="he">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">שיעורים במודול</p>
      <p className="mt-1 text-[0.8125rem] font-semibold leading-snug text-[#0f2347] sm:text-sm">{moduleTitleHe}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500 sm:text-xs">כל השיעורים בפרק — לחצו כדי לעבור (גם לפני סיום השלבים).</p>
      <nav className="mt-2.5 space-y-1" aria-label="שיעורים במודול">
        {lessons.map((l, i) => {
          const here = l.id === currentLessonId;
          return (
            <div key={l.id}>
              {here ? (
                <div
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg border-e-[3px] border-e-sky-500 bg-stone-100/95 py-2 pe-2 ps-1.5 sm:py-2.5",
                    "ring-1 ring-stone-200/80",
                  )}
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-bold tabular-nums text-sky-900 ring-1 ring-sky-200/90 sm:h-8 sm:w-8 sm:text-xs"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5 text-[0.8125rem] font-semibold leading-snug text-[#0f2347] sm:text-[0.9375rem]">
                    {l.title}
                    <span className="mt-0.5 block text-[10px] font-normal text-sky-900/80 sm:text-[11px]">השיעור הנוכחי</span>
                  </span>
                </div>
              ) : (
                <Link
                  href={l.href}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-transparent py-2 pe-2 ps-1.5 text-start transition hover:border-stone-200/90 hover:bg-stone-50/90 sm:py-2.5"
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-stone-200/80 bg-white text-[11px] font-semibold tabular-nums text-slate-600 sm:h-8 sm:w-8 sm:text-xs"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[0.9375rem] leading-snug text-slate-700 sm:text-[0.95rem]">{l.title}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
