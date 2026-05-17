"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { AmirantInfoBlocks } from "@/components/prep/amirant-info/AmirantInfoBlocks";
import { AmirantSyllabusPublic } from "@/components/prep/amirant-info/AmirantSyllabusPublic";
import { PrepBreadcrumbs } from "@/components/prep/catalog/PrepBreadcrumbs";
import { ButtonLink, Container, Heading, PageLayout, Section, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { AMIRANT_GENERAL_INFO_BLOCKS } from "@/lib/prep/amirant-general-info-blocks";
import { AMIRANT_HUB_INTRO_BLOCKS } from "@/lib/prep/amirant-hub-intro-blocks";
import { AMIRANT_COURSE_SYLLABUS_META } from "@/lib/prep/amirant-course-syllabus";
import { PREP_BASE } from "@/lib/prep/constants";

const AmirantPracticeFlow = dynamic(
  () =>
    import("@/components/prep/amirant-demo/AmirantPracticeFlow").then((m) => m.AmirantPracticeFlow),
  { ssr: false, loading: () => <p className="py-8 text-center text-sm text-muted">טוען מבחן לדוגמה…</p> },
);

export type AmirantHubTab = "info" | "intro" | "sample";

const TABS: { id: AmirantHubTab; label: string }[] = [
  { id: "info", label: "מידע על המבחן" },
  { id: "intro", label: "מבוא" },
  { id: "sample", label: "מבחן לדוגמה" },
];

function isHubTab(v: string | null): v is AmirantHubTab {
  return v === "info" || v === "intro" || v === "sample";
}

function PrepAmirantHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: AmirantHubTab = isHubTab(rawTab) ? rawTab : "info";

  const setTab = useCallback(
    (next: AmirantHubTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`${PREP_BASE}/amirant?${params.toString()}`, { scroll: false });
      document.getElementById("amirant-hub-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [router, searchParams],
  );

  const courseHref = `${PREP_BASE}/amirant/course`;
  const loginHref = `${PREP_BASE}/login?next=${encodeURIComponent(courseHref)}`;

  return (
    <div className="bg-paper">
      <PageLayout pad="lg">
        <Container max="measureWide">
          <PrepBreadcrumbs
            items={[
              { label: "קורסים", href: `${PREP_BASE}/courses` },
              { label: "אמירנט" },
            ]}
          />
          <Heading level={1} className="mt-ds-4 max-w-3xl">
            אמירנט — הכנה למבחן המיון
          </Heading>
          <Text as="p" variant="bodyLg" className="mt-ds-4 max-w-readable leading-relaxed text-muted">
            {AMIRANT_COURSE_SYLLABUS_META.shortNoteHe} לפני שמתחילים את המסלול המלא: מידע על המבחן, מבוא לקורס, ומבחן קצר לדוגמה.
          </Text>

          <div
            className="mt-ds-8 flex flex-wrap gap-2 border-b border-line/80 pb-ds-2"
            role="tablist"
            aria-label="תוכן אמירנט"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`amirant-tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-t-control px-4 py-2.5 text-sm font-semibold transition",
                  tab === t.id
                    ? "bg-primary text-paper shadow-card"
                    : "text-muted hover:bg-surface-low hover:text-primary",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Container>
      </PageLayout>

      <Section id="amirant-hub-panel" tone="canvas" padding="loose" className="scroll-mt-24 border-t border-line/80">
        <Container max="measureWide">
          {tab === "info" && (
            <div id="amirant-tab-info" role="tabpanel">
              <Text as="p" variant="labelAccent" className="mb-ds-4">
                מידע כללי
              </Text>
              <AmirantInfoBlocks blocks={AMIRANT_GENERAL_INFO_BLOCKS} />
            </div>
          )}

          {tab === "intro" && (
            <div id="amirant-tab-intro" role="tabpanel" className="space-y-ds-10">
              <div>
                <Text as="p" variant="labelAccent" className="mb-ds-4">
                  {AMIRANT_COURSE_SYLLABUS_META.courseTitleHe}
                </Text>
                <AmirantInfoBlocks blocks={AMIRANT_HUB_INTRO_BLOCKS} />
              </div>
              <AmirantSyllabusPublic />
            </div>
          )}

          {tab === "sample" && (
            <div id="amirant-tab-sample" role="tabpanel">
              <Heading level={2} className="mb-ds-3">
                מבחן לדוגמה — 10 שאלות
              </Heading>
              <Text as="p" variant="body" className="mb-ds-8 max-w-readable text-muted">
                תרגול קצר ללא התחברות: השלמת משפטים, ניסוח מחדש והבנת הנקרא. בסיום תקבלו משוב מיידי — אותו מנוע שמשמש בקורס המלא.
              </Text>
              <AmirantPracticeFlow embedded shortQuizOnly />
            </div>
          )}
        </Container>
      </Section>

      <Section tone="paper" padding="loose" className="border-t border-line/80">
        <Container max="measureWide" className="flex flex-col items-start gap-ds-4 sm:flex-row sm:flex-wrap sm:items-center">
          <ButtonLink href={courseHref} variant="primary" className="px-ds-5 py-ds-3">
            התחילו את הקורס המלא
          </ButtonLink>
          <Link href={loginHref} className="text-sm font-semibold text-primary hover:underline">
            התחברות לשמירת התקדמות
          </Link>
          <Link href={PREP_BASE} className="text-sm text-muted hover:text-primary">
            ← חזרה לעמוד הבית
          </Link>
        </Container>
      </Section>
    </div>
  );
}

export function PrepAmirantHub() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-muted">טוען…</p>}>
      <PrepAmirantHubInner />
    </Suspense>
  );
}
