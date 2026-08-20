"use client";

/**
 * עמוד הקורס = לחדש את המסע:
 * 1) "המשך ללמוד" - הפעולה הראשית היחידה, עם הקשר מלא.
 * 2) "תוכנית הקורס" - קוביות מודולים עם אימוג'י והסבר קצר (העדפת בעל המוצר),
 *    על טוקנים של מערכת העיצוב: התקדמות, מודול נוכחי מסומן, CTA ברור.
 */
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { useAmirantCourseAccess } from "./AmirantCourseAccessProvider";
import { cn } from "@/lib/design-system/cn";
import { CourseWeeklyGoalBanner } from "./CourseWeeklyGoalBanner";
import type { ManifestLesson, ManifestModule } from "@/lib/amirant-course/types/course-manifest";

const BASE = `${PREP_BASE}/amirant/course`;

function lessonHref(lesson: ManifestLesson) {
  return `${BASE}/lesson/${lesson.id}`;
}

const MODULE_META: Record<string, { icon: string; badge?: string; desc: string }> = {
  "mod-intro": {
    icon: "🗺️",
    desc: "איך המבחן בנוי, מה כל ציון שווה, ואיך מתקדמים בקורס - כולל מבחן רמה.",
  },
  "mod-vocab": {
    icon: "📚",
    desc: "חבילות מילים מדורגות עם כרטיסים, חזרה מרווחת (יודע/קשה/שוב) וטיפים לזכירה.",
  },
  "mod-sc": {
    icon: "✏️",
    desc: "השלמת משפטים: זיהוי רמזים במשפט, פסילת מסיחים ותרגול ברמה שלכם.",
  },
  "mod-rephrase": {
    icon: "🔄",
    desc: "ניסוח מחדש: לזהות את המשפט ששומר על אותה משמעות בדיוק.",
  },
  "mod-reading": {
    icon: "📖",
    desc: "קטעי קריאה אקדמיים עם אסטרטגיות סקירה ושאלות בסגנון המבחן.",
  },
  "mod-reform": {
    icon: "🎧",
    desc: "רפורמת 2026: שמיעה, תצורת מילים וכתיבה. בפיילוט הרשמי הפרקים האלה עדיין לא נספרים לציון — מתרגלים כדי להיות מוכנים.",
  },
  "mod-sims": {
    icon: "🎯",
    desc: "שישה מבחנים מלאים בתנאי זמן אמיתיים, עם דוח אישי אחרי כל סימולציה.",
  },
  "mod-tips": {
    icon: "💡",
    desc: "אסטרטגיות מבחן, ניהול זמן ומה עושים כשנתקעים על שאלה.",
  },
  "mod-summary": {
    icon: "🏁",
    desc: "חזרה מרוכזת על כל החומר ותוכנית לערב שלפני המבחן.",
  },
  "mod-logistics": {
    icon: "📋",
    desc: "הרשמה, מועדים, מחירים ומה מביאים ליום המבחן.",
  },
};

function ModuleCard({
  mod,
  index,
  completedIds,
  currentLessonId,
  locked,
}: {
  mod: ManifestModule;
  index: number;
  completedIds: Set<string>;
  currentLessonId: string | null;
  locked: boolean;
}) {
  const doneInModule = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  const total = mod.lessons.length;
  const pct = total > 0 ? Math.round((doneInModule / total) * 100) : 0;
  const allDone = total > 0 && doneInModule === total;
  const isCurrent = mod.lessons.some((l) => l.id === currentLessonId);
  const meta = MODULE_META[mod.id] ?? { icon: "📌", desc: `${total} שיעורים במודול הזה.` };

  // יעד הקליק: השיעור הנוכחי > הבא שטרם הושלם > הראשון
  const target =
    mod.lessons.find((l) => l.id === currentLessonId) ??
    mod.lessons.find((l) => !completedIds.has(l.id)) ??
    mod.lessons[0];
  const href = locked
    ? `${PREP_BASE}/pricing?module=${encodeURIComponent(mod.slug)}`
    : target
      ? lessonHref(target)
      : BASE;
  const ctaLabel = locked
    ? "בגישה מלאה"
    : allDone
      ? "חזרה על החומר"
      : doneInModule === 0
        ? "התחל"
        : "המשך";

  return (
    <Link
      href={href}
      dir="rtl"
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-paper p-5 transition-all",
        locked
          ? "border-line/80 opacity-95 hover:border-primary/30"
          : allDone
            ? "border-emerald-300/70 hover:border-emerald-400/70"
            : isCurrent
              ? "border-score/50 ring-1 ring-score/25 hover:shadow-card"
              : "border-line hover:border-primary/35 hover:shadow-card",
      )}
    >
      {locked ? (
        <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          בגישה מלאה
        </span>
      ) : isCurrent && !allDone ? (
        <span className="absolute -top-2.5 right-4 rounded-full bg-score px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          ממשיכים כאן
        </span>
      ) : mod.slug === "introduction" ? (
        <span className="absolute -top-2.5 right-4 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
          מבוא חינם
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
            allDone ? "bg-emerald-500/10" : "bg-primary/[0.06]",
          )}
          aria-hidden
        >
          {allDone ? "✅" : meta.icon}
        </span>
      </div>

      <p className="mt-3 font-bold leading-snug text-ink">
        <span className="text-muted/70">{index + 1}. </span>
        {mod.title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{meta.desc}</p>

      <div className="mt-auto pt-4">
        <div className="h-1 overflow-hidden rounded-full bg-surface-high">
          <div
            className={cn("h-1 rounded-full transition-all", allDone ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className={cn("tabular-nums", allDone ? "font-medium text-emerald-700" : "text-muted")}>
            {allDone ? "✓ הושלם" : `${doneInModule}/${total} שיעורים`}
          </span>
          <span className="font-semibold text-muted transition-colors group-hover:text-primary">{ctaLabel}</span>
        </div>
      </div>
    </Link>
  );
}

export function AmirantCurriculumHub() {
  const progress = useAmirantCourseProgress();
  const { hasFullAccess, loading: accessLoading } = useAmirantCourseAccess();
  const manifest = AMIRANT_PREPARATION_MANIFEST;

  if (!progress.ready || accessLoading) {
    return (
      <div dir="rtl" className="mx-auto max-w-5xl animate-pulse space-y-6 py-8">
        <div className="h-28 rounded-2xl bg-surface-low" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-surface-low" />
          ))}
        </div>
      </div>
    );
  }

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
    <div dir="rtl" className="mx-auto w-full max-w-[60rem] px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-6">
        <CourseWeeklyGoalBanner />
      </div>
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
                {completedCount === 0 ? "התחל את השיעור הראשון" : "המשך בשיעור"}
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
            <p className="mt-1.5 text-sm text-muted">זה הזמן לחזק עם סימולציות מלאות בטיימר.</p>
            <Link
              href={`${BASE}/simulation/${manifest.simulations[0]?.id ?? ""}`}
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-control bg-primary px-8 text-base font-bold text-white transition hover:bg-primary-hover"
            >
              לסימולציה מלאה
            </Link>
          </>
        )}
      </section>

      {/* ── תוכנית הקורס - קוביות מודולים ── */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-primary">תוכנית הקורס</h2>
          <span className="text-xs tabular-nums text-muted">
            {completedCount}/{totalLessons} שיעורים הושלמו
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.modules.map((mod, mi) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              index={mi}
              completedIds={completedIds}
              currentLessonId={currentLessonId}
              locked={isAmirantModuleLocked(mod, hasFullAccess)}
            />
          ))}
        </div>

        {manifest.simulations.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-primary">סימולציות מלאות</h2>
            <p className="mt-1 text-sm text-muted">שישה מבחנים עם טיימר — כמו ביום הבחינה. מומלץ אחרי היחידות העיקריות.</p>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {manifest.simulations.map((sim, i) => (
                <li key={sim.id}>
                  <Link
                    href={`${BASE}/simulation/${sim.id}`}
                    className="flex min-h-14 items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 text-sm font-semibold text-primary transition hover:border-primary/35"
                  >
                    <span>
                      {i + 1}. {sim.title}
                    </span>

                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
