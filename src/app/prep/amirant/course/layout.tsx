import type { Metadata } from "next";
import Link from "next/link";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPrepShowCourseAssistant } from "@/lib/prep/prep-full-access";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { AmirantCourseAccessProvider } from "@/components/prep/amirant-course/AmirantCourseAccessProvider";
import { Container } from "@/components/ui";
import { AmirantCourseFloatingChat } from "@/components/prep/amirant-course/AmirantCourseFloatingChat";
import { AmirantCourseProgressProvider } from "@/components/prep/amirant-course/AmirantCourseProgressProvider";
import { AmirantPersistenceProvider } from "@/components/prep/amirant-course/AmirantPersistenceProvider";

const BASE = `${PREP_BASE}/amirant/course`;

export const metadata: Metadata = {
  title: "הכנה לאמירנט",
  description: AMIRANT_PREPARATION_MANIFEST.description,
};

export default async function AmirantCourseLayout({ children }: { children: React.ReactNode }) {
  // העוזר האישי — למנויים בלבד (תואם את הגייט ב-lesson-chat route); dev/preview דרך הדגל
  let showCourseChat = getPrepShowCourseAssistant();
  if (!showCourseChat) {
    const client = createPrepSupabaseServerClient();
    if (client) {
      const {
        data: { user },
      } = await client.auth.getUser();
      showCourseChat = user ? await hasAmirantFullAccess(client, user.id) : false;
    }
  }
  return (
    <AmirantPersistenceProvider>
      <AmirantCourseAccessProvider>
      <AmirantCourseProgressProvider>
        <div className="bg-canvas min-h-screen">
          {/* App-mode header — replaces the site MarketingHeader inside the course */}
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
                className="flex items-center gap-2 py-3.5 text-sm font-bold text-[#0f1e3d] transition hover:opacity-80"
              >
                <span className="text-[1.1rem] leading-none">◈</span>
                הכנה לאמירנט
              </Link>

              {/* Right: course nav */}
              <nav dir="rtl" className="flex items-center gap-0.5 py-2">
                <Link
                  href={BASE}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#5a6480] transition hover:bg-[#f0f4ff] hover:text-[#0f1e3d]"
                >
                  תוכנית הקורס
                </Link>
                <Link
                  href={`${BASE}/dashboard`}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#5a6480] transition hover:bg-[#f0f4ff] hover:text-[#0f1e3d]"
                >
                  לוח תלמיד
                </Link>
              </nav>
            </div>
          </header>
          {/* Full-bleed children (e.g. lesson workspace). Narrow pages wrap themselves in <Container max="measureWide">. */}
          <div className="w-full max-w-none py-6 pb-32 md:py-8 md:pb-40">{children}</div>
          {showCourseChat ? <AmirantCourseFloatingChat /> : null}
        </div>
      </AmirantCourseProgressProvider>
      </AmirantCourseAccessProvider>
    </AmirantPersistenceProvider>
  );
}
