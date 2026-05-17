"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PREP_LEARNING_NAV } from "@/lib/prep/constants";

const navTap = "inline-flex min-h-[2.75rem] items-center";

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
        className={`${navTap} cursor-pointer list-none touch-manipulation text-sm text-muted marker:content-none transition hover:text-primary [&::-webkit-details-marker]:hidden`}
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
          {PREP_LEARNING_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                className="block min-h-[2.75rem] px-4 py-2.5 text-sm leading-snug text-ink transition hover:bg-surface-low hover:text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
