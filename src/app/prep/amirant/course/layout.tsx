import type { Metadata } from "next";
import Link from "next/link";
import {
  AMIRANT_PREPARATION_MANIFEST,
  getAmirantContentQualityMode,
} from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPrepShowCourseAssistant } from "@/lib/prep/prep-full-access";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { AmirantCourseAccessProvider } from "@/components/prep/amirant-course/AmirantCourseAccessProvider";
import { Container, Text } from "@/components/ui";
import { AmirantCourseFloatingChat } from "@/components/prep/amirant-course/AmirantCourseFloatingChat";
import { AmirantCourseProgressProvider } from "@/components/prep/amirant-course/AmirantCourseProgressProvider";
import { AmirantPersistenceProvider } from "@/components/prep/amirant-course/AmirantPersistenceProvider";

const BASE = `${PREP_BASE}/amirant/course`;

export const metadata: Metadata = {
  title: "Amirant Preparation",
  description: AMIRANT_PREPARATION_MANIFEST.description,
};

export default async function AmirantCourseLayout({ children }: { children: React.ReactNode }) {
  const qualityMode = getAmirantContentQualityMode();
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
          <div className="border-b border-line/70 bg-paper/90 backdrop-blur">
            <Container className="flex flex-wrap items-center justify-between gap-3 py-3" max="measureWide">
              <Link href={BASE} className="text-sm font-semibold text-primary">
                Amirant Preparation
              </Link>
              <nav className="flex flex-wrap gap-3 text-xs font-medium text-muted">
                <Link href={BASE} className="hover:text-primary">
                  תוכנית
                </Link>
                <Link href={`${BASE}/paid`} className="hover:text-primary">
                  הקורס בתשלום
                </Link>
                <Link href={`${BASE}/dashboard`} className="hover:text-primary">
                  לוח תלמיד
                </Link>
                <Link href={`${BASE}/analytics`} className="hover:text-primary">
                  אנליטיקה
                </Link>
                <Link href={`${BASE}/review`} className="hover:text-primary">
                  סקירת בוחנים
                </Link>
                <Text as="span" variant="caption" className="text-muted">
                  {qualityMode === "demo_generated_present"
                    ? "תוכן דמו-גנרטיבי (לא production)"
                    : qualityMode === "demo_fallback"
                      ? "תוכן דמו (fallback)"
                      : "תוכן production"}
                </Text>
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
