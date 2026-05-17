import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardBody, CardTitle, Container, Text } from "@/components/ui";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { loadStudentDashboardData } from "@/lib/amirant-course/student-insights";
import { AmirantReviewFallbackClient } from "@/components/prep/amirant-course/AmirantReviewFallbackClient";

export const metadata: Metadata = {
  title: "סקירות בוחנים | Amirant Preparation",
};

export default async function AmirantCourseReviewIndexPage() {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return (
      <Container max="measureWide">
        <Card>
          <CardBody className="p-6">
            <Text as="p" variant="body">
              Supabase לא מוגדר כרגע.
            </Text>
          </CardBody>
        </Card>
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
    <div className="space-y-6">
      <Text as="h1" variant="titlePage">
        סקירות בוחנים אחרונות
      </Text>
      <Card>
        <CardTitle>בחר ניסיון לסקירה</CardTitle>
        <CardBody>
          <ul className="space-y-2 text-sm">
            {data.recentQuizAttempts.map((attempt) => (
              <li
                key={attempt.attemptId}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {attempt.quizId} · {attempt.scorePct != null ? `${attempt.scorePct}%` : "ללא ציון"}
                </span>
                <Link
                  href={`/prep/amirant/course/review/${attempt.attemptId}`}
                  className="font-semibold text-primary"
                >
                  צפייה בסקירה
                </Link>
              </li>
            ))}
            {data.recentQuizAttempts.length === 0 ? <li>אין נסיונות עדיין.</li> : null}
          </ul>
        </CardBody>
      </Card>
    </div>
    </Container>
  );
}
