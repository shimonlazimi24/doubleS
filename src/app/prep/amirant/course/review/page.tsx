import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import type { Metadata } from "next";
import { Container, Text } from "@/components/ui";
import { getManifestQuiz } from "@/lib/amirant-course/manifest";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { loadStudentDashboardData } from "@/lib/amirant-course/student-insights";
import { AmirantReviewFallbackClient } from "@/components/prep/amirant-course/AmirantReviewFallbackClient";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

export const metadata: Metadata = {
  title: "סקירות בוחנים | הכנה לאמירנט",
};

function quizTitle(quizId: string): string {
  return getManifestQuiz(quizId)?.title ?? quizId;
}

export default async function AmirantCourseReviewIndexPage() {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return (
      <Container max="measureWide">
        <AmirantReviewFallbackClient />
      </Container>
    );
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return (
      <Container max="measureWide">
        <AmirantReviewFallbackClient />
      </Container>
    );
  }

  const data = await loadStudentDashboardData(client, user.id);

  return (
    <Container max="measureWide">
      <div className="mx-auto w-full max-w-[52rem] space-y-8" dir="rtl">
        <div>
          <Text as="h1" variant="titlePage">
            סקירות בוחנים
          </Text>
          <Text as="p" variant="bodySm" className="mt-2 text-muted">
            כל ניסיון שסיימתם - עם ציון וסקירה מלאה של הטעויות.
          </Text>
        </div>

        {data.recentQuizAttempts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-8 text-center">
            <Text as="p" variant="body" className="font-semibold text-ink">
              עוד אין כאן בוחנים לסקירה
            </Text>
            <Text as="p" variant="bodySm" className="mt-2 text-muted">
              השלימו מבחן רמה או בוחן ראשון - וכל ניסיון יופיע כאן עם ציון וסקירה.
            </Text>
            <Link
              href={`${COURSE_BASE}/quiz/quiz-entry-diagnostic`}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              למבחן הרמה
            </Link>
          </div>
        ) : (
          <ul>
            {data.recentQuizAttempts.map((attempt) => (
              <li
                key={attempt.attemptId}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 py-3.5 last:border-0"
              >
                <span className="text-sm font-medium text-ink">
                  {quizTitle(attempt.quizId)}
                  <span className="ms-2 tabular-nums text-muted">
                    {attempt.scorePct != null ? `${attempt.scorePct}%` : "ללא ציון"}
                  </span>
                </span>
                <Link
                  href={`${COURSE_BASE}/review/${attempt.attemptId}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  צפייה בסקירה
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href={COURSE_BASE} className="inline-block text-sm font-semibold text-primary">
          חזרה לקורס
        </Link>
      </div>
    </Container>
  );
}
