"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getManifestQuiz } from "@/lib/amirant-course";
import { loadAnalytics } from "@/lib/amirant-course/analytics/storage";
import { recommendationHeForDiagnosticScorePct } from "@/lib/amirant-course/lesson-content/entry-diagnostic-recommendation-he";
import { getSyllabusUiForModule } from "@/lib/amirant-course/syllabus-ui";
import type { ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import { Card, CardBody, Text } from "@/components/ui";
import { AmirantLessonTrackIsland } from "../AmirantLessonTrackIsland";
import { cn } from "@/lib/design-system/cn";

const DIAGNOSTIC_QUIZ_ID = "quiz-entry-diagnostic";

type Props = {
  courseBase: string;
  module: ManifestModule;
  /** Present on lesson route - enables progress tracking + complete CTA. */
  lessonId: string;
  lessonTitle: string;
  nextLessonHref: string;
  nextLessonTitle: string;
  /** e.g. היחידה הבאה: מילון מושגים */
  nextScopeEyebrow: string;
  className?: string;
};

/** שמות היסטוריים של מבחן הכניסה - סשנים ישנים נשמרו תחת הכותרות הקודמות. */
const LEGACY_DIAGNOSTIC_LABELS = new Set([
  "מבחן אבחון כניסה (15 שאלות, תערובת נושאים)",
  "מבחן אבחון כניסה",
]);

function latestDiagnosticScorePct(diagnosticLabel: string): number | null {
  if (typeof window === "undefined") return null;
  const a = loadAnalytics();
  const quizSessions = a.sessions.filter(
    (s) =>
      s.kind === "quiz" &&
      (s.label === diagnosticLabel || LEGACY_DIAGNOSTIC_LABELS.has(s.label)) &&
      s.scorePct != null,
  );
  if (quizSessions.length === 0) return null;
  const last = quizSessions[quizSessions.length - 1]!;
  return last.scorePct ?? null;
}

/**
 * Personalized roadmap after entry diagnostic; falls back to syllabus copy when no quiz session is found.
 */
export function IntroPersonalRoadmapClient({
  courseBase,
  module,
  lessonId,
  lessonTitle,
  nextLessonHref,
  nextLessonTitle,
  nextScopeEyebrow,
  className,
}: Props) {
  const diagnosticQuiz = getManifestQuiz(DIAGNOSTIC_QUIZ_ID);
  const diagnosticLabel = diagnosticQuiz?.title ?? "מבחן רמה";

  const [scorePct, setScorePct] = useState<number | null>(null);
  useEffect(() => {
    setScorePct(latestDiagnosticScorePct(diagnosticLabel));
  }, [diagnosticLabel]);

  const syllabus = getSyllabusUiForModule(module);
  const fallbackParagraph =
    syllabus?.howToHe?.[1] ??
    "מבחן רמה: 8 השלמת משפטים, 4 ניסוח מחדש, 3 הבנת הנקרא - כ־20 דק׳, ובסיום ציון משוער בסולם 50–150.";

  const personalized = scorePct != null ? recommendationHeForDiagnosticScorePct(scorePct) : null;

  return (
    <div className={cn("mx-auto w-full max-w-[52rem] px-1 [direction:rtl] [text-align:start]", className)} lang="he">
      <Card className="border-stone-200/90 shadow-sm">
        <CardBody className="space-y-5 p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">מפת דרכים אישית</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0f2347] sm:text-3xl">המלצה למסלול לימודים</h1>
            <div className="mt-2 flex justify-end">
              <AmirantLessonTrackIsland lessonId={lessonId} lessonTitle={lessonTitle} className="w-full sm:w-auto" />
            </div>
            <Text as="p" variant="body" className="mt-3 text-slate-600">
              ההתאמה האישית מבוססת על <strong>תוצאת מבחן הרמה</strong> בקורס. אם עדיין לא נבחנתם - התחילו
              במבחן הרמה ואז חזרו לעמוד זה.
            </Text>
          </div>

          {scorePct != null && personalized ? (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 ring-1 ring-slate-900/[0.04] sm:p-6">
              <p className="text-sm font-medium text-slate-500">תוצאה אחרונה במבחן הרמה</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#0f2347]">{scorePct}%</p>
              <h2 className="mt-4 text-lg font-semibold text-[#0f2347]">{personalized.title}</h2>
              <div className="prose prose-slate mt-3 max-w-none whitespace-pre-line text-base leading-relaxed text-slate-700">
                {personalized.body}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-amber-950">עדיין אין תוצאת מבחן רמה במערכת</h2>
              <Text as="p" variant="body" className="mt-2 text-amber-950/90">
                {fallbackParagraph}
              </Text>
              <Link
                href={`${courseBase}/quiz/${DIAGNOSTIC_QUIZ_ID}`}
                className="mt-4 inline-flex min-h-[2.75rem] items-center justify-center rounded-xl bg-[#0f2347] px-5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0f2347]/90"
              >
                מעבר למבחן רמה
              </Link>
            </div>
          )}

          <div className="border-t border-stone-100 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{nextScopeEyebrow}</p>
            <h2 className="mt-1 text-base font-semibold text-[#0f2347]">המשך מומלץ</h2>
            <Link
              href={nextLessonHref}
              className="mt-3 inline-flex min-h-[2.75rem] flex-col justify-center gap-0.5 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-start text-sm text-gray-900 transition hover:border-sky-800/30"
            >
              <span className="font-medium">המשך לשיעור הבא</span>
              <span className="text-xs text-muted">{nextLessonTitle}</span>
            </Link>
            <p className="mt-4 text-xs text-muted">
              <Link className="font-medium text-primary underline-offset-2 hover:underline" href={courseBase}>
                חזרה לתוכנית הקורס
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
