"use client";

/**
 * The course page, laid out like a course platform rather than a landing page:
 * a syllabus of modules on the side, the selected module open in the middle
 * with its lessons grouped the way a learner works through them, and one
 * primary action, "continue". No cards inside cards, no badges, no emoji.
 */
import { useMemo, useState } from "react";
import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { groupModuleLessons, lessonNameInModule, splitLessonTitle, sumMinutes } from "@/lib/amirant-course/lesson-content/module-lesson-groups";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { useAmirantCourseAccess } from "./AmirantCourseAccessProvider";
import { cn } from "@/lib/design-system/cn";
import { CourseWeeklyGoalBanner } from "./CourseWeeklyGoalBanner";
import type { ManifestLesson, ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import { AmirantVideoEmbed } from "@/components/prep/amirant-course/lesson/AmirantVideoEmbed";

const BASE = `${PREP_BASE}/amirant/course`;

const MODULE_BLURB: Record<string, string> = {
  "mod-intro": "איך המבחן בנוי, מה כל ציון שווה ואיך מתקדמים בקורס. כולל מבחן רמה.",
  "mod-vocab": "חבילות מילים מדורגות עם כרטיסים וחזרה מרווחת.",
  "mod-sc": "השלמת מילה חסרה במשפט: זיהוי הרמז, פסילת מסיחים, ואז תרגול לפי רמה.",
  "mod-rephrase": "המשפט ששומר על אותה משמעות בדיוק: השיטה, המלכודות, ומקבצים לפי רמה.",
  "mod-reading": "קטעים אקדמיים: שיטות קריאה, מבנה פסקה, מלכודות, וקטעים מדורגים.",
  "mod-reform": "חלקי הרפורמה: הבנת הנשמע, יצירת מילה וכתיבה.",
  "mod-sims": "מבחנים מלאים בתנאי זמן, עם דוח אחרי כל אחד.",
  "mod-tips": "ניהול זמן, סדר פתירה, ומה עושים כשנתקעים.",
  "mod-summary": "חזרה מרוכזת לפני המבחן.",
  "mod-logistics": "הרשמה, מועדים, מחירים ומה מביאים ליום המבחן.",
};

type LessonState = "done" | "current" | "todo";

function lessonHref(lesson: ManifestLesson): string {
  return `${BASE}/lesson/${lesson.id}`;
}

function formatMinutes(min: number): string {
  if (min >= 90) {
    const h = Math.round((min / 60) * 2) / 2;
    return `כ־${h} שעות`;
  }
  return `${min} דק׳`;
}

function StatusDot({ state }: { state: LessonState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "box-border inline-block h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px]",
        state === "done" && "border-primary bg-primary",
        state === "current" && "border-primary bg-paper",
        state === "todo" && "border-line bg-paper",
      )}
    />
  );
}

function LessonRow({ lesson, state, locked, moduleSlug }: { lesson: ManifestLesson; state: LessonState; locked: boolean; moduleSlug: string }) {
  const { level } = splitLessonTitle(lesson.title);
  const name = lessonNameInModule(lesson.title);
  const href = locked ? `${PREP_BASE}/pricing?module=${encodeURIComponent(moduleSlug)}` : lessonHref(lesson);
  return (
    <Link
      href={href}
      className="grid grid-cols-[1.125rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-line/70 px-1 py-3 text-ink transition-colors hover:bg-surface-low sm:grid-cols-[1.125rem_minmax(0,1fr)_7rem_4.5rem]"
    >
      <StatusDot state={state} />
      <span className={cn("min-w-0 truncate text-[15px]", state === "current" ? "font-bold" : "font-medium")}>{name}</span>
      <span className="hidden text-xs text-muted sm:block">{level ?? (locked ? "בגישה מלאה" : "")}</span>
      <span className="text-start text-xs tabular-nums text-muted sm:text-end">
        {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} דק׳` : ""}
      </span>
    </Link>
  );
}

function ModulePanel({
  mod,
  index,
  total,
  stateOf,
  locked,
  continueLesson,
}: {
  mod: ManifestModule;
  index: number;
  total: number;
  stateOf: (id: string) => LessonState;
  locked: boolean;
  continueLesson: ManifestLesson | null;
}) {
  const groups = groupModuleLessons(mod);
  const done = mod.lessons.filter((l) => stateOf(l.id) === "done").length;
  const minutes = sumMinutes(mod.lessons);
  const cta = continueLesson
    ? { href: lessonHref(continueLesson), label: `${done === 0 ? "התחל" : "המשך"}: ${splitLessonTitle(continueLesson.title).name}` }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">
            מודול {index + 1} מתוך {total}
          </p>
          <h1 className="mt-1 text-[1.75rem] font-extrabold leading-tight text-ink sm:text-3xl">{mod.title}</h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">{MODULE_BLURB[mod.id] ?? ""}</p>
          <p className="mt-2 text-[13px] text-muted">
            {mod.lessons.length} שיעורים · {formatMinutes(minutes)} · {done} הושלמו
          </p>
        </div>
        {locked ? (
          <Link
            href={`${PREP_BASE}/pricing?module=${encodeURIComponent(mod.slug)}`}
            className="inline-flex h-[42px] shrink-0 items-center justify-center rounded border border-primary px-5 text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
          >
            פתיחת המודול בגישה מלאה
          </Link>
        ) : cta ? (
          <Link
            href={cta.href}
            className="inline-flex h-[42px] shrink-0 items-center justify-center rounded bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>

      {groups.map((g) => (
        <section key={g.key}>
          <div className="flex items-baseline justify-between pb-2">
            <h2 className="text-base font-bold text-ink">{g.title}</h2>
            <span className="text-[13px] text-muted">
              {g.lessons.length} {g.key === "guide" ? "שיעורים" : g.key === "sims" ? "סימולציות" : "יחידות"} · {formatMinutes(sumMinutes(g.lessons))}
            </span>
          </div>
          <div className="border-t border-line">
            {g.lessons.map((l) => (
              <LessonRow key={l.id} lesson={l} state={stateOf(l.id)} locked={locked} moduleSlug={mod.slug} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function AmirantCurriculumHub({ introVideoUrl }: { introVideoUrl?: string }) {
  const progress = useAmirantCourseProgress();
  const { hasFullAccess, loading: accessLoading } = useAmirantCourseAccess();
  const manifest = AMIRANT_PREPARATION_MANIFEST;
  const modules = manifest.modules;

  const completedIds = useMemo(() => {
    if (!progress.ready) return new Set<string>();
    return new Set(
      modules
        .flatMap((m) => m.lessons)
        .filter((l) => progress.getLessonStatus(l.id) === "completed")
        .map((l) => l.id),
    );
  }, [modules, progress]);

  // The current lesson is the first one not yet completed, in course order.
  const currentLessonId = useMemo(() => {
    for (const mod of modules) for (const l of mod.lessons) if (!completedIds.has(l.id)) return l.id;
    return null;
  }, [modules, completedIds]);
  const currentModuleId = modules.find((m) => m.lessons.some((l) => l.id === currentLessonId))?.id ?? modules[0]?.id ?? null;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const selected = modules.find((m) => m.id === (selectedId ?? currentModuleId)) ?? modules[0];

  if (!progress.ready || accessLoading) {
    return (
      <div dir="rtl" className="mx-auto max-w-[75rem] animate-pulse px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-5 w-4/5 rounded bg-surface-low" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-8 w-2/5 rounded bg-surface-low" />
          <div className="h-4 w-3/5 rounded bg-surface-low" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 rounded bg-surface-low" />
          ))}
        </div>
      </div>
    );
  }

  const stateOf = (id: string): LessonState => (completedIds.has(id) ? "done" : id === currentLessonId ? "current" : "todo");
  const continueLessonIn = (mod: ManifestModule): ManifestLesson | null =>
    mod.lessons.find((l) => l.id === currentLessonId) ?? mod.lessons.find((l) => !completedIds.has(l.id)) ?? mod.lessons[0] ?? null;

  const moduleRow = (mod: ManifestModule, i: number, active: boolean, onClick: () => void) => {
    const done = mod.lessons.filter((l) => completedIds.has(l.id)).length;
    const locked = isAmirantModuleLocked(mod, hasFullAccess);
    return (
      <button
        key={mod.id}
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={cn(
          "grid w-full grid-cols-[1.375rem_minmax(0,1fr)_auto] items-baseline gap-2.5 border-e-2 py-2.5 pe-3 text-start transition-colors",
          active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink",
        )}
      >
        <span className="text-[13px] tabular-nums text-muted">{i + 1}</span>
        <span className={cn("text-sm leading-snug", active ? "font-bold" : "font-medium")}>{mod.title}</span>
        <span className="text-xs tabular-nums text-muted">{locked ? "נעול" : `${done}/${mod.lessons.length}`}</span>
      </button>
    );
  };

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[75rem] px-4 sm:px-6">
      {introVideoUrl?.trim() ? (
        <div className="pt-6">
          <AmirantVideoEmbed src={introVideoUrl} title="סרטון פתיחה לקורס" />
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
        {/* Syllabus: desktop sidebar */}
        <aside className="sticky top-14 hidden max-h-[calc(100vh-3.5rem)] self-start overflow-y-auto border-e border-line py-7 pe-0 lg:block" aria-label="תוכנית הקורס">
          <p className="pb-3 pe-3 text-xs font-bold tracking-[0.08em] text-muted">תוכנית הקורס</p>
          <div className="-me-px flex flex-col">
            {modules.map((mod, i) => moduleRow(mod, i, mod.id === selected?.id, () => setSelectedId(mod.id)))}
          </div>
          <div className="mt-6 pe-3">
            <CourseWeeklyGoalBanner />
          </div>
        </aside>

        {/* Desktop: the selected module */}
        <main className="hidden py-7 lg:block">
          {selected ? (
            <ModulePanel
              mod={selected}
              index={modules.indexOf(selected)}
              total={modules.length}
              stateOf={stateOf}
              locked={isAmirantModuleLocked(selected, hasFullAccess)}
              continueLesson={continueLessonIn(selected)}
            />
          ) : null}
        </main>
      </div>

      {/* Phone and tablet: continue, then the modules as an accordion */}
      <div className="py-6 lg:hidden">
        {selected ? (
          <div className="flex flex-col gap-2 border-b border-line pb-5">
            <p className="text-[13px] text-muted">
              {selected.title} · {selected.lessons.filter((l) => completedIds.has(l.id)).length} מתוך {selected.lessons.length}
            </p>
            {(() => {
              const next = continueLessonIn(selected);
              const locked = isAmirantModuleLocked(selected, hasFullAccess);
              if (!next) return null;
              const { name, level } = splitLessonTitle(next.title);
              return (
                <>
                  <p className="text-xl font-extrabold leading-tight text-ink">{name}</p>
                  <p className="text-sm text-muted">
                    {[level, next.estimatedMinutes ? `${next.estimatedMinutes} דק׳` : null].filter(Boolean).join(" · ")}
                  </p>
                  <Link
                    href={locked ? `${PREP_BASE}/pricing?module=${encodeURIComponent(selected.slug)}` : lessonHref(next)}
                    className="mt-2 inline-flex h-11 items-center justify-center rounded bg-primary px-5 text-[15px] font-bold text-white"
                  >
                    {locked ? "פתיחה בגישה מלאה" : completedIds.size === 0 ? "התחל" : "המשך"}
                  </Link>
                </>
              );
            })()}
            <div className="pt-2">
              <CourseWeeklyGoalBanner />
            </div>
          </div>
        ) : null}

        <div className="flex items-baseline justify-between pb-1 pt-6">
          <h2 className="text-[15px] font-bold text-ink">תוכנית הקורס</h2>
          <span className="text-[13px] tabular-nums text-muted">
            {completedIds.size} מתוך {modules.flatMap((m) => m.lessons).length}
          </span>
        </div>
        <div className="border-t border-line">
          {modules.map((mod, i) => {
            const open = mobileOpenId === mod.id;
            const locked = isAmirantModuleLocked(mod, hasFullAccess);
            return (
              <div key={mod.id} className="border-b border-line/70">
                {moduleRow(mod, i, mod.id === currentModuleId, () => setMobileOpenId(open ? null : mod.id))}
                {open ? (
                  <div className="pb-4 ps-7">
                    {groupModuleLessons(mod).map((g) => (
                      <div key={g.key} className="pt-2">
                        <p className="pb-1 text-xs font-bold text-muted">{g.title}</p>
                        {g.lessons.map((l) => (
                          <LessonRow key={l.id} lesson={l} state={stateOf(l.id)} locked={locked} moduleSlug={mod.slug} />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
