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
  title: "Amirant Preparation",
  description: AMIRANT_PREPARATION_MANIFEST.description,
};

export default async function AmirantCourseLayout({ children }: { children: React.ReactNode }) {
  let showCourseChat = getPrepShowCourseAssistant();
  if (!showCourseChat) {
    const client = createPrepSupabaseServerClient();
    if (client) {
      const {
        data: { user },
      } = await client.auth.getUser();
      showCourseChat = await hasAmirantFullAccess(client, user?.id ?? null);
    }
  }
  return (
    <AmirantPersistenceProvider>
      <AmirantCourseAccessProvider>
      <AmirantCourseProgressProvider>
        <div className="bg-canvas min-h-screen">
          <div className="border-b border-line/70 bg-paper/90 backdrop-blur" dir="rtl">
            <Container className="flex items-center justify-between gap-4 py-3" max="measureWide">
              <Link href={BASE} className="flex items-center gap-2 text-sm font-bold text-[#0f1e3d]">
                <span className="text-base">◈</span>
                הכנה לאמירנט
              </Link>
              <nav className="flex items-center gap-1">
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
            </Container>
          </div>
          {/* Full-bleed children (e.g. lesson workspace). Narrow pages wrap themselves in <Container max="measureWide">. */}
          <div className="w-full max-w-none py-6 pb-32 md:py-8 md:pb-40">{children}</div>
          {showCourseChat ? <AmirantCourseFloatingChat /> : null}
        </div>
      </AmirantCourseProgressProvider>
      </AmirantCourseAccessProvider>
    </AmirantPersistenceProvider>
  );
}
