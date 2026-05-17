"use client";

import Link from "next/link";
import type { ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import { getOrderedSyllabusModules, displayModuleTitleHe, getSyllabusUiForModule } from "@/lib/amirant-course";
import { getModuleCtaLabel, getModulePrimaryLessonId } from "@/lib/amirant-course/module-cta";
import { PREP_BASE } from "@/lib/prep/constants";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { useAmirantCourseAccess } from "./AmirantCourseAccessProvider";
import { cn } from "@/lib/design-system/cn";

const COURSE = `${PREP_BASE}/amirant/course`;

type Props = {
  modules: ManifestModule[];
};

/**
 * Official syllabus: one card per module, progress + primary CTA + link to module hub.
 */
export function AmirantCourseModuleGrid({ modules }: Props) {
  const { getModuleProgress, getLessonStatus } = useAmirantCourseProgress();
  const { hasFullAccess, loading: accessLoading } = useAmirantCourseAccess();
  const ordered = getOrderedSyllabusModules(modules);

  return (
    <section className="space-y-4" aria-labelledby="amirant-program-modules">
      <div>
        <h2 id="amirant-program-modules" className="text-lg font-semibold text-ink md:text-xl">
          מבנה הקורס (לפי סילבוס)
        </h2>
        <p className="mt-1 text-sm text-muted">
          תשעה מודולים לפי אותו סילבוס — ממבוא ומילון מושגים, דרך מיומנויות הליבה והרפורמה, ועד סימולציות, טיפים
          וסיכום. בכל מודול: שיעורי ליבה, תרגול ומבחנים; &quot;התחל / המשך&quot; או &quot;סקירת הפרק&quot; (דף מודול).
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((mod) => {
          const meta = getSyllabusUiForModule(mod);
          const order = meta?.order ?? mod.sortOrder + 1;
          const titleHe = displayModuleTitleHe(mod);
          const oneLiner = meta?.oneLinerHe ?? mod.title;
          const { completed, total, percent } = getModuleProgress(mod);
          const firstLessonId = getModulePrimaryLessonId(mod, getLessonStatus);
          const cta = getModuleCtaLabel(mod, getLessonStatus);
          const locked = !accessLoading && isAmirantModuleLocked(mod, hasFullAccess);
          const primaryHref = locked
            ? `${PREP_BASE}/pricing?module=${mod.slug}`
            : firstLessonId
              ? `${COURSE}/lesson/${firstLessonId}`
              : `${COURSE}/module/${mod.slug}`;

          return (
            <li
              key={mod.id}
              className={cn(
                "flex h-full min-h-0 flex-col justify-between gap-3 rounded-2xl border border-line/70 bg-paper p-4 shadow-sm transition",
                locked ? "opacity-90" : "hover:border-primary/30 hover:shadow-md",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white"
                    aria-hidden
                  >
                    {order}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-muted">{percent}%</span>
                </div>
                <h3 className="mt-2 text-base font-semibold leading-snug text-ink">{titleHe}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{oneLiner}</p>
                <p className="mt-2 text-[0.7rem] text-muted/90">
                  {total > 0 ? (
                    <>
                      {completed}/{total} שיעורים
                    </>
                  ) : (
                    <>מודול הסבר (ללא שיעורים)</>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
                <Link
                  href={primaryHref}
                  className={cn(
                    "inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-control px-3 text-sm font-semibold",
                    locked
                      ? "border border-line bg-canvas text-primary"
                      : "bg-primary text-white shadow-sm hover:bg-primary/90",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50",
                  )}
                >
                  {locked ? "פתיחה בתשלום" : cta}
                </Link>
                {!locked ? (
                  <Link
                    href={`${COURSE}/module/${mod.slug}`}
                    className="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-control border border-line bg-paper px-3 text-sm font-medium text-primary transition hover:border-primary/40"
                  >
                    סקירת הפרק
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
