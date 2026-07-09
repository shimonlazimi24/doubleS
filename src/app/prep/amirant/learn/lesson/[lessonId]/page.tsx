import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AMIRANT_DEMO_IDS } from "@/lib/prep/amirant-demo/seed-constants";
import { getAmirantLessonEntry, getAmirantLessonNeighbors } from "@/lib/prep/amirant-learn-navigation";
import { PREP_BASE } from "@/lib/prep/constants";
import { Card, CardBody, Container, Heading, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

const LEARN = `${PREP_BASE}/amirant/learn`;

type Props = { params: { lessonId: string } };

export function generateMetadata({ params }: Props): Metadata {
  const row = getAmirantLessonEntry(params.lessonId);
  if (!row) return { title: "שיעור" };
  return { title: `${row.lesson.title} | אמירנט` };
}

export default function AmirantLessonPage({ params }: Props) {
  const row = getAmirantLessonEntry(params.lessonId);
  if (!row) notFound();

  const { prev, next } = getAmirantLessonNeighbors(params.lessonId);
  const isExamLesson = row.lesson.id === AMIRANT_DEMO_IDS.lessons.m2exam;
  const kindLabel =
    row.lesson.kind === "video" ? "וידאו" : row.lesson.kind === "text" ? "קריאה" : "שיעור מעורב";

  return (
    <div className="bg-canvas">
      <Container className="py-8 md:py-10" max="measureWide">
        <nav className="text-xs font-medium text-muted">
          <Link href={LEARN} className="transition hover:text-primary">
            תוכנית הקורס
          </Link>
          <span className="mx-2 text-line">/</span>
          <span className="text-ink">{row.module.title}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Text as="p" variant="caption" className="text-primary">
              שיעור {row.index + 1} מתוך {row.totalLessons} · {kindLabel}
            </Text>
            <Heading level={1} className="mt-2 text-2xl md:text-3xl">
              {row.lesson.title}
            </Heading>
          </div>
          <button
            type="button"
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-900"
          >
            סמנו כנצפה (דמו)
          </button>
        </div>

        {isExamLesson ? (
          <Card className="mt-8 overflow-hidden border-primary/30 shadow-card">
            <CardBody className="space-y-4 bg-primary/[0.04] p-6 md:p-8">
              <Heading level={2} className="text-xl">
                יחידת מבחן מערכת
              </Heading>
              <Text as="p" variant="body" className="max-w-readable">
                {row.lesson.bodyPreview}
              </Text>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`${PREP_BASE}/amirant/practice`}
                  className="inline-flex rounded-control bg-primary px-6 py-3 text-sm font-semibold text-white shadow-cta hover:bg-primary-hover"
                >
                  פתיחת תרגול ומבחן סימולציה
                </Link>
                <Link
                  href={`${PREP_BASE}/amirant/demo#demo-adaptive`}
                  className="inline-flex rounded-control border border-line bg-paper px-5 py-3 text-sm font-semibold text-primary hover:bg-surface-low"
                >
                  דמו מלא (עמוד אחד)
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-surface border border-line/80 bg-ink shadow-card">
                <div className="aspect-video bg-gradient-to-br from-primary/40 via-surface-high to-ink flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <span className="text-sm font-medium text-white/90">נגן וידאו (יתווסף כאן)</span>
                  {row.lesson.videoPath ? (
                    <span className="max-w-xs truncate text-xs text-white/60">{row.lesson.videoPath}</span>
                  ) : null}
                </div>
              </div>

              <Card>
                <CardBody className="space-y-4 p-6 md:p-8">
                  <Heading level={2} className="text-lg">
                    תוכן השיעור
                  </Heading>
                  <Text as="p" variant="bodyLg" className="leading-relaxed text-ink">
                    {row.lesson.bodyPreview}
                  </Text>
                  <Text as="p" variant="bodySm" className="text-muted">
                    גוף מלא (Markdown / קבצים) יחובר ל-Supabase או ל-CMS בהמשך - כרגע תקציר מהמבנה הקורס.
                  </Text>
                </CardBody>
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardBody className="p-5">
                  <Text as="p" variant="labelAccent" className="mb-3">
                    בקורס שקונים
                  </Text>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      ניווט שיעור־אחר־שיעור
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      סימון צפייה (דמו)
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">✓</span>
                      התאמה למובייל
                    </li>
                  </ul>
                  {row.lesson.estimatedMinutes != null ? (
                    <p className="mt-4 border-t border-line/60 pt-4 text-xs text-muted">
                      זמן משוער: כ־{row.lesson.estimatedMinutes} דק׳
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            </aside>
          </div>
        )}

        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line/80 pt-8">
          {prev ? (
            <Link
              href={`${LEARN}/lesson/${prev.lesson.id}`}
              className={cn(
                "group flex max-w-[48%] flex-col rounded-lg border border-line/80 bg-paper px-4 py-3 shadow-card transition hover:border-primary/40",
              )}
            >
              <span className="text-xs text-muted">הקודם</span>
              <span className="mt-1 text-sm font-semibold text-ink group-hover:text-primary">{prev.lesson.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`${LEARN}/lesson/${next.lesson.id}`}
              className="group flex max-w-[48%] flex-col items-end rounded-lg border border-line/80 bg-paper px-4 py-3 text-end shadow-card transition hover:border-primary/40"
            >
              <span className="text-xs text-muted">הבא</span>
              <span className="mt-1 text-sm font-semibold text-ink group-hover:text-primary">{next.lesson.title}</span>
            </Link>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
