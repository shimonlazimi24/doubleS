import type { Metadata } from "next";
import Link from "next/link";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { AmirantCourseAccessProvider } from "@/components/prep/amirant-course/AmirantCourseAccessProvider";
import { AmirantCourseAssistantGate } from "@/components/prep/amirant-course/AmirantCourseAssistantGate";
import { AmirantCourseProgressProvider } from "@/components/prep/amirant-course/AmirantCourseProgressProvider";
import { AmirantPersistenceProvider } from "@/components/prep/amirant-course/AmirantPersistenceProvider";

const BASE = `${PREP_BASE}/amirant/course`;

export const metadata: Metadata = {
  title: "הכנה לאמירנט",
  description: AMIRANT_PREPARATION_MANIFEST.description,
};

/**
 * The layout does no data fetching. It used to resolve the user and their
 * entitlement here (two round trips to the database) just to decide whether
 * to show the assistant, and because a layout renders before its page, every
 * page under /course waited for that before its own loading state could show.
 * The assistant is now gated in the browser (AmirantCourseAssistantGate); the
 * tester entitlement moved to the lesson access gate.
 */
export default function AmirantCourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AmirantPersistenceProvider>
      <AmirantCourseAccessProvider>
      <AmirantCourseProgressProvider>
        <div className="bg-canvas min-h-screen">
          {/* App-mode header - replaces the site MarketingHeader inside the course */}
          <header className="sticky top-0 z-[100] border-b border-line/60 bg-paper/95 backdrop-blur-lg">
            <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-0 sm:px-6">
              {/* Left: back to site */}
              <Link
                href={PREP_BASE}
                className="flex shrink-0 items-center gap-1.5 py-3.5 text-xs font-medium text-muted transition hover:text-ink"
                aria-label="חזרה לאתר PREPARE"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="rtl:rotate-180">
                  <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="hidden sm:inline">PREPARE</span>
              </Link>

              {/* Centre: course identity */}
              <Link
                href={BASE}
                dir="rtl"
                className="flex items-center gap-2 py-3.5 text-sm font-bold text-primary transition hover:opacity-80"
              >
                <span className="text-[1.1rem] leading-none">◈</span>
                הכנה לאמירנט
              </Link>

              {/* Right: course nav */}
              <nav dir="rtl" className="flex max-w-[55%] items-center justify-end gap-0.5 overflow-x-auto py-2 sm:max-w-none">
                <Link
                  href={BASE}
                  prefetch={false}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-surface-low hover:text-primary sm:px-3 sm:text-sm"
                >
                  תוכנית
                  <span className="hidden sm:inline"> הקורס</span>
                </Link>
                <Link
                  href={`${BASE}/dashboard`}
                  prefetch={false}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-surface-low hover:text-primary sm:px-3 sm:text-sm"
                >
                  לוח
                  <span className="hidden sm:inline"> תלמיד</span>
                </Link>
                <Link
                  href={`${PREP_BASE}/settings`}
                  prefetch={false}
                  className="hidden shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-low hover:text-primary sm:inline-flex"
                >
                  אזור אישי
                </Link>
              </nav>
            </div>
          </header>
          {/* Full-bleed children (e.g. lesson workspace). Narrow pages wrap themselves in <Container max="measureWide">. */}
          <div className="w-full max-w-none py-6 pb-32 md:py-8 md:pb-40">{children}</div>
          <AmirantCourseAssistantGate />
        </div>
      </AmirantCourseProgressProvider>
      </AmirantCourseAccessProvider>
    </AmirantPersistenceProvider>
  );
}
