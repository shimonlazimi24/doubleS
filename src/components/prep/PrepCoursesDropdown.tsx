"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PREP_COURSES } from "@/lib/prep/brand";
import { PREP_BASE } from "@/lib/prep/constants";

const CATALOG_ITEM = { href: `${PREP_BASE}/courses`, label: "כל ההכנות" } as const;

const navTap =
  "relative inline-flex min-h-10 items-center px-1 text-sm font-medium text-muted transition-colors hover:text-ink";

/**
 * <details> נשאר „פתוח” אחרי Next.js client navigation — לכן נסגור בלחיצה וב־route change.
 */
export function PrepCoursesDropdown() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  const close = () => {
    const el = detailsRef.current;
    if (el) el.open = false;
  };

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        className={`${navTap} cursor-pointer list-none touch-manipulation marker:content-none [&::-webkit-details-marker]:hidden`}
      >
        <span className="inline-flex items-center gap-1">
          קורסים
          <span className="text-[0.65em] opacity-70" aria-hidden>
            ▾
          </span>
        </span>
      </summary>
      <div className="absolute end-0 top-full z-[110] pt-2">
        <ul
          className="min-w-[13rem] rounded-surface border border-line/90 bg-paper py-2 shadow-card"
          role="list"
        >
          <li>
            <Link
              href={CATALOG_ITEM.href}
              onClick={close}
              className="block min-h-[2.75rem] border-b border-line/60 px-4 py-2.5 text-sm font-semibold leading-snug text-ink transition hover:bg-surface-low hover:text-primary"
            >
              {CATALOG_ITEM.label}
            </Link>
          </li>
          {PREP_COURSES.map((course) => {
            const comingSoon = course.status === "coming_soon";
            const rowClass =
              "flex min-h-[2.75rem] items-center justify-between gap-3 px-4 py-2.5 text-sm leading-snug transition";

            if (comingSoon) {
              return (
                <li key={course.id}>
                  <Link
                    href={course.href}
                    onClick={close}
                    className={`${rowClass} text-muted hover:bg-surface-low hover:text-ink`}
                  >
                    <span>{course.shortTitle}</span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      בקרוב
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={course.id}>
                <Link
                  href={course.href}
                  onClick={close}
                  className={`${rowClass} text-ink hover:bg-surface-low hover:text-primary`}
                >
                  <span>{course.shortTitle}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
