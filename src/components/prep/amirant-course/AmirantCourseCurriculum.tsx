"use client";

import Link from "next/link";
import type { ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import { displayModuleTitleHe, getOrderedSyllabusModules } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { cn } from "@/lib/design-system/cn";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";

const COURSE = `${PREP_BASE}/amirant/course`;

function ChevronStart() {
  return (
    <svg
      className="size-4 shrink-0 text-primary/35 transition group-hover:text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function AmirantCourseCurriculum({ modules }: { modules: ManifestModule[] }) {
  const { getLessonStatus, getModuleProgress } = useAmirantCourseProgress();
  const list = getOrderedSyllabusModules(modules);

  return (
    <section className="mt-14 border-t border-line/70 pt-12" aria-labelledby="amirant-all-lessons-heading">
      <div>
        <h2
          id="amirant-all-lessons-heading"
          className="font-display text-xl font-semibold tracking-tight text-ink md:text-2xl"
        >
          כל השיעורים לפי מודול
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          מבט מפורט (שורה = שיעור). מעל כבר מופיעים התקדמות, מודולים ו־&quot;סקירת הפרק&quot; - כאן אפשר לרדת לרמת שיעור
          בודד.
        </p>
      </div>

      <div className="mt-10 space-y-5">
        {list.map((mod, modIdx) => {
          const lessons = mod.lessons;
          const modProgress = getModuleProgress(mod);
          return (
            <article
              key={mod.id}
              className="overflow-hidden rounded-2xl border border-line/70 bg-paper shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.12)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/60 bg-gradient-to-l from-primary/[0.06] to-transparent px-5 py-4 md:px-6 md:py-5">
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm"
                    aria-hidden
                  >
                    {modIdx + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-base font-semibold leading-snug text-ink md:text-lg">
                      {displayModuleTitleHe(mod)}
                    </h3>
                    <p className="mt-0.5">
                      <Link
                        href={`${COURSE}/module/${mod.slug}`}
                        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                        title="מסלול, שיעורים, תרגול ומבחנים לפי המניפסט"
                      >
                        סקירת הפרק
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {lessons.length} {lessons.length === 1 ? "שיעור" : "שיעורים"}
                      {mod.quizzes.length ? ` · ${mod.quizzes.length} מבחנים` : ""}
                      {mod.practiceSets.length ? ` · ${mod.practiceSets.length} סטי תרגול` : ""}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      התקדמות מודול: {modProgress.completed}/{modProgress.total} ({modProgress.percent}%)
                    </p>
                  </div>
                </div>
              </div>

              {lessons.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted md:px-6">
                  אין שיעורים במניפסט במודול זה - התוכן מופיע בדף המודול (סילבוס והסבר).
                </p>
              ) : (
              <ol className="divide-y divide-line/50">
                {lessons.map((lesson, i) => {
                  const status = getLessonStatus(lesson.id);
                  return (
                  <li key={lesson.id}>
                    <div
                      className={cn(
                        "flex flex-wrap items-stretch gap-3 px-4 py-3.5 transition md:px-6 md:py-4",
                        "hover:bg-primary/[0.035]",
                      )}
                    >
                      <Link
                        href={`${COURSE}/lesson/${lesson.id}`}
                        className="group flex min-w-0 flex-1 items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary/40"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums group-hover:text-primary",
                            status === "completed" && "border border-emerald-500/50 bg-emerald-500/10 text-emerald-900",
                            status === "in_progress" && "border border-amber-500/40 bg-amber-500/10 text-amber-950",
                            status === "not_started" && "bg-surface-low text-muted group-hover:bg-primary/10",
                          )}
                          title={status === "completed" ? "הושלם" : status === "in_progress" ? "בתהליך" : "לא הותחל"}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 text-start">
                          <span className="block text-sm font-medium leading-snug text-ink group-hover:text-primary">
                            {lesson.title}
                          </span>
                          {lesson.estimatedMinutes != null ? (
                            <span className="mt-0.5 block text-xs text-muted sm:hidden">~{lesson.estimatedMinutes} דק׳</span>
                          ) : null}
                        </span>
                        {lesson.estimatedMinutes != null ? (
                          <span className="hidden shrink-0 text-xs tabular-nums text-muted sm:inline">~{lesson.estimatedMinutes} דק׳</span>
                        ) : null}
                        <ChevronStart />
                      </Link>
                      {lesson.quizId || lesson.practiceSetId ? (
                        <div className="flex shrink-0 flex-col justify-center gap-1 border-r border-line/60 pr-3 text-xs md:pr-4">
                          {lesson.quizId ? (
                            <Link href={`${COURSE}/quiz/${lesson.quizId}`} className="font-medium text-primary underline-offset-2 hover:underline">
                              מבחן
                            </Link>
                          ) : null}
                          {lesson.practiceSetId ? (
                            <Link
                              href={`${COURSE}/practice/${lesson.practiceSetId}`}
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              תרגול
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                  );
                })}
              </ol>
              )}

              {mod.practiceSets.length > 0 || mod.quizzes.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t border-line/50 bg-surface-low/50 px-4 py-3 md:px-6">
                  {mod.practiceSets.map((ps) => (
                    <Link
                      key={ps.id}
                      href={`${COURSE}/practice/${ps.id}`}
                      className="rounded-full border border-line/80 bg-paper px-3 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      {ps.title}
                    </Link>
                  ))}
                  {mod.quizzes.map((q) => (
                    <Link
                      key={q.id}
                      href={`${COURSE}/quiz/${q.id}`}
                      className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
                    >
                      {q.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
