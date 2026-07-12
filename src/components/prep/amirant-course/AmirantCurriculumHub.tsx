"use client";

/**
 * עמוד הקורס = לחדש את המסע (DESIGN_GUIDELINES):
 * 1) "המשך ללמוד" - הפעולה הראשית היחידה, עם הקשר מלא.
 * 2) "תוכנית הקורס" - רשימת מסע שטוחה: הושלם/נוכחי/בהמשך במבט אחד.
 * בלי hero כהה, בלי כרטיסי קישוט, בלי אימוג'י, בלי גריד כרטיסיות.
 */
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { cn } from "@/lib/design-system/cn";
import type { ManifestLesson } from "@/lib/amirant-course/types/course-manifest";

const BASE = `${PREP_BASE}/amirant/course`;

function lessonHref(lesson: ManifestLesson) {
  return `${BASE}/lesson/${lesson.id}`;
}

export function AmirantCurriculumHub() {
  const progress = useAmirantCourseProgress();
  const manifest = AMIRANT_PREPARATION_MANIFEST;

  const completedIds = new Set(
    manifest.modules
      .flatMap((m) => m.lessons)
      .filter((l) => progress.getLessonStatus(l.id) === "completed")
      .map((l) => l.id),
  );

  // השיעור הנוכחי = הראשון שטרם הושלם
  let currentLessonId: string | null = null;
  for (const mod of manifest.modules) {
    for (const lesson of mod.lessons) {
      if (!completedIds.has(lesson.id)) {
        currentLessonId = lesson.id;
        break;
      }
    }
    if (currentLessonId) break;
  }

  const allLessons = manifest.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = completedIds.size;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const currentLesson = currentLessonId ? allLessons.find((l) => l.id === currentLessonId) : null;
  const currentModule = currentLesson
    ? manifest.modules.find((m) => m.lessons.some((l) => l.id === currentLesson.id))
    : null;
  const currentLessonNumber = currentLesson
    ? allLessons.findIndex((l) => l.id === currentLesson.id) + 1
    : totalLessons;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[52rem] px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      {/* ── המשך ללמוד - הפעולה הראשית ── */}
      <section className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        {currentLesson ? (
          <>
            <p className="text-xs font-semibold tracking-[0.12em] text-accent">
              {completedCount === 0 ? "מתחילים כאן" : "המשך ללמוד"}
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-primary sm:text-3xl">
              {currentLesson.title}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {currentModule?.title} · שיעור {currentLessonNumber} מתוך {totalLessons} בקורס
            </p>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={lessonHref(currentLesson)}
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-8 text-base font-bold text-white shadow-cta transition hover:bg-primary-hover"
              >
                {completedCount === 0 ? "התחל את השיעור הראשון ←" : "המשך בשיעור ←"}
              </Link>
              {completedCount > 0 ? (
                <div className="flex items-center gap-3 text-xs text-muted">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-high">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="tabular-nums">{pct}% מהקורס</span>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-[0.12em] text-score">כל הכבוד!</p>
            <h1 className="mt-2 text-2xl font-bold text-primary sm:text-3xl">סיימתם את כל שיעורי הקורס</h1>
            <p className="mt-1.5 text-sm text-muted">זה הזמן לחזק עם סימולציות בתנאי אמת.</p>
            <Link
              href={`${BASE}/simulation/${manifest.simulations[0]?.id ?? ""}`}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-8 text-base font-bold text-white transition hover:bg-primary-hover"
            >
              לסימולציה מלאה ←
            </Link>
          </>
        )}
      </section>

      {/* ── תוכנית הקורס - רשימת מסע שטוחה ── */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-primary">תוכנית הקורס</h2>
          <span className="text-xs tabular-nums text-muted">
            {completedCount}/{totalLessons} שיעורים הושלמו
          </span>
        </div>

        <ol className="mt-4 overflow-hidden rounded-2xl border border-line bg-paper">
          {manifest.modules.map((mod, mi) => {
            const doneInModule = mod.lessons.filter((l) => completedIds.has(l.id)).length;
            const total = mod.lessons.length;
            const allDone = total > 0 && doneInModule === total;
            const isCurrent = mod.lessons.some((l) => l.id === currentLessonId);
            const target =
              mod.lessons.find((l) => l.id === currentLessonId) ??
              mod.lessons.find((l) => !completedIds.has(l.id)) ??
              mod.lessons[0];
            return (
              <li key={mod.id} className={cn(mi > 0 && "border-t border-line/70")}>
                <Link
                  href={target ? lessonHref(target) : BASE}
                  className={cn(
                    "grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-4 py-3.5 transition sm:px-5",
                    isCurrent ? "bg-primary text-white" : "hover:bg-surface-low",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                      allDone
                        ? "bg-emerald-100 text-emerald-700"
                        : isCurrent
                          ? "bg-white/15 text-white"
                          : "bg-primary/[0.06] text-primary",
                    )}
                    aria-hidden
                  >
                    {allDone ? "✓" : mi + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block truncate text-sm font-semibold sm:text-base", !isCurrent && "text-ink")}>
                      {mod.title}
                    </span>
                    <span className={cn("block text-xs", isCurrent ? "text-white/70" : "text-muted")}>
                      {total} שיעורים
                      {isCurrent && currentLesson ? ` · עכשיו: ${currentLesson.title}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                      allDone
                        ? "bg-emerald-100 text-emerald-800"
                        : isCurrent
                          ? "bg-white/15 text-white/90"
                          : "bg-surface-low text-muted",
                    )}
                  >
                    {allDone ? "הושלם" : `${doneInModule}/${total}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>

        {manifest.simulations.length > 0 ? (
          <p className="mt-4 text-sm text-muted">
            מוכנים לתרגול בתנאי אמת?{" "}
            <Link
              href={`${BASE}/simulation/${manifest.simulations[0].id}`}
              className="font-semibold text-accent underline-offset-4 hover:underline"
            >
              סימולציה מלאה עם טיימר ←
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
