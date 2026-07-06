import type { Metadata } from "next";
import Link from "next/link";
import { AMIRANT_DEMO_COURSE, AMIRANT_DEMO_MODULES } from "@/lib/prep/amirant-demo/demo-course-content";
import { getAmirantFlatLessons, getAmirantFirstLessonId } from "@/lib/prep/amirant-learn-navigation";
import { PREP_BASE } from "@/lib/prep/constants";
import { AmirantLearnCurriculum } from "@/components/prep/amirant-learn/AmirantLearnCurriculum";
import { Card, CardBody, CardTitle, Container, Heading, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "אמירנט — הקורס",
  description: "תוכנית לימודים, התקדמות ושיעורים — חוויית קורס דיגיטלי.",
};

export default function AmirantLearnHomePage() {
  const flat = getAmirantFlatLessons();
  const total = flat.length;
  const completedMock = Math.min(2, total);
  const pct = total > 0 ? Math.round((completedMock / total) * 100) : 0;
  const firstId = getAmirantFirstLessonId();
  const firstHref = firstId ? `${PREP_BASE}/amirant/learn/lesson/${firstId}` : `${PREP_BASE}/amirant/learn`;

  return (
    <div className="bg-canvas">
      <Container className="py-8 md:py-10" max="measureWide">
        <div className="rounded-2xl border border-line/80 bg-gradient-to-br from-primary/[0.07] via-paper to-surface-low p-6 shadow-card md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Text as="p" variant="eyebrow" className="text-primary">
                קורס דיגיטלי
              </Text>
              <Heading level={1} className="mt-2 text-3xl md:text-4xl">
                {AMIRANT_DEMO_COURSE.title}
              </Heading>
              <Text as="p" variant="bodyLg" className="mt-4 max-w-readable leading-relaxed text-muted">
                {AMIRANT_DEMO_COURSE.description}
              </Text>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={firstHref}
                  className="inline-flex items-center justify-center rounded-control bg-primary px-6 py-3 text-sm font-semibold text-white shadow-cta transition hover:bg-primary-hover"
                >
                  המשיכו ללמוד
                </Link>
                <Link
                  href={`${PREP_BASE}/amirant/info`}
                  className="inline-flex items-center justify-center rounded-control border border-line bg-paper px-5 py-3 text-sm font-semibold text-primary shadow-card hover:bg-surface-low"
                >
                  מידע כללי וסילבוס
                </Link>
                <Link
                  href={`${PREP_BASE}/amirant/course`}
                  className="inline-flex items-center justify-center rounded-control border border-primary/40 bg-paper px-5 py-3 text-sm font-semibold text-primary shadow-card hover:bg-primary/5"
                >
                  קורס ההכנה לאמירנט
                </Link>
              </div>
            </div>

            <Card className="w-full max-w-sm shrink-0 border-primary/20 bg-paper/95 shadow-card lg:mt-0">
              <CardBody className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="border-0 p-0 text-base">התקדמות בקורס</CardTitle>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    דמו
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-muted">
                    <span>
                      {completedMock} מתוך {total} שיעורים
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-line/40">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <Text as="p" variant="bodySm" className="text-muted">
                  בהמשך התקדמות תישמר בחשבון (Supabase) — כרגע ערכי הדמו לתצוגה בלבד.
                </Text>
              </CardBody>
            </Card>
          </div>
        </div>

        <AmirantLearnCurriculum modules={AMIRANT_DEMO_MODULES} />
      </Container>
    </div>
  );
}
