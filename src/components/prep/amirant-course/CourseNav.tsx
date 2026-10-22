"use client";

import { usePathname } from "next/navigation";
import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { useAmirantCourseProgressOptional } from "./AmirantCourseProgressProvider";
import { cn } from "@/lib/design-system/cn";

const BASE = `${PREP_BASE}/amirant/course`;

const TABS: { href: string; label: string; short: string; isActive: (path: string) => boolean }[] = [
  {
    href: BASE,
    label: "הקורס",
    short: "הקורס",
    isActive: (p) => p === BASE || p.startsWith(`${BASE}/lesson`) || p.startsWith(`${BASE}/module`) || p.startsWith(`${BASE}/simulation`) || p.startsWith(`${BASE}/quiz`) || p.startsWith(`${BASE}/practice`),
  },
  {
    href: `${BASE}/dashboard`,
    label: "ההתקדמות שלי",
    short: "התקדמות",
    isActive: (p) => p.startsWith(`${BASE}/dashboard`) || p.startsWith(`${BASE}/analytics`) || p.startsWith(`${BASE}/review`),
  },
  { href: `${PREP_BASE}/settings`, label: "החשבון", short: "חשבון", isActive: (p) => p.startsWith(`${PREP_BASE}/settings`) },
];

/**
 * The course's top bar: wordmark, three tabs with the active one underlined,
 * and one progress figure. The same bar on every screen under the login, so
 * moving between the course, the progress page and the account never feels
 * like leaving the app.
 */
export function CourseNav() {
  const pathname = usePathname() ?? "";
  const progress = useAmirantCourseProgressOptional();
  const lessons = AMIRANT_PREPARATION_MANIFEST.modules.flatMap((m) => m.lessons);
  const done = progress?.ready ? lessons.filter((l) => progress.getLessonStatus(l.id) === "completed").length : null;

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-paper">
      <div className="mx-auto flex h-14 max-w-[75rem] items-center justify-between gap-4 px-4 sm:px-6" dir="rtl">
        <div className="flex h-full items-center gap-5 sm:gap-7">
          <Link href={PREP_BASE} className="flex h-full items-center text-[15px] font-extrabold tracking-wide text-primary" aria-label="PREPARE, חזרה לאתר">
            PREPARE
          </Link>
          <nav aria-label="ניווט בקורס" className="flex h-full items-stretch gap-4 sm:gap-6">
            {TABS.map((tab) => {
              const active = tab.isActive(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-11 items-center justify-center border-b-2 text-sm transition-colors",
                    active ? "border-primary font-bold text-primary" : "border-transparent font-medium text-muted hover:text-primary",
                  )}
                >
                  <span className="sm:hidden">{tab.short}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        {done != null ? (
          <div className="hidden items-center gap-3 text-xs text-muted sm:flex" aria-label="התקדמות בקורס">
            <span className="tabular-nums">
              {done} מתוך {lessons.length} שיעורים
            </span>
            <span className="h-1 w-28 bg-surface-high" aria-hidden>
              <span className="block h-full bg-primary" style={{ width: `${Math.round((done / lessons.length) * 100)}%` }} />
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
