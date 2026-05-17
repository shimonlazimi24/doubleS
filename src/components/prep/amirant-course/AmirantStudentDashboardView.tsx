import Link from "next/link";
import { Card, CardBody, CardTitle, Text } from "@/components/ui";
import type { StudentDashboardData } from "@/lib/amirant-course/student-insights";
import { AmirantNextBestActionCard } from "@/components/prep/amirant-course/AmirantNextBestActionCard";

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function AmirantStudentDashboardView({
  data,
}: {
  data: StudentDashboardData;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Text as="h1" variant="titlePage">
          לוח תלמיד
        </Text>
        <Text as="p" variant="bodySm" className="mt-1 max-w-readable text-muted">
          כאן מרוכזות המלצות (צעד הבא), מגמות ניקוד, ורמות נושא — בלי שינוי לוגיקה, רק תמצית סילבוס.
        </Text>
      </div>

      <AmirantNextBestActionCard action={data.recommendedNextAction} className="border-primary/20" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>נושאים חלשים</CardTitle>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {data.weakTopics.length ? (
                data.weakTopics.map((row) => (
                  <li key={row.topic} className="flex justify-between">
                    <span>{row.topicLabel}</span>
                    <span className="text-muted">
                      {row.totalCorrect}/{row.totalAnswered} ({pct(row.accuracy)})
                    </span>
                  </li>
                ))
              ) : (
                <li>אין מספיק נתונים עדיין.</li>
              )}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardTitle>נושאים חזקים</CardTitle>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {data.strongTopics.length ? (
                data.strongTopics.map((row) => (
                  <li key={row.topic} className="flex justify-between">
                    <span>{row.topicLabel}</span>
                    <span className="text-muted">
                      {row.totalCorrect}/{row.totalAnswered} ({pct(row.accuracy)})
                    </span>
                  </li>
                ))
              ) : (
                <li>אין מספיק נתונים עדיין.</li>
              )}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardTitle>רמה נוכחית לפי נושא</CardTitle>
        <CardBody>
          <ul className="space-y-2 text-sm">
            {data.currentLevelByTopic.map((row) => (
              <li key={row.topic} className="flex flex-wrap justify-between gap-2">
                <span>{row.topicLabel}</span>
                <span className="text-muted">
                  רמה {row.level}
                  {row.recentAccuracy != null
                    ? ` · דיוק אחרון ${Math.round(row.recentAccuracy * 100)}%`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>דיוק לאורך זמן</CardTitle>
          <CardBody>
            <ul className="space-y-1 text-sm">
              {data.accuracyOverTime.slice(-10).map((p, i) => (
                <li key={`${p.label}-${i}`} className="flex justify-between">
                  <span>{p.label}</span>
                  <span className="font-medium text-ink">{p.accuracyPct}%</span>
                </li>
              ))}
              {data.accuracyOverTime.length === 0 ? <li>אין עדיין ניסיונות.</li> : null}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardTitle>מגמת זמן לשאלה</CardTitle>
          <CardBody>
            <ul className="space-y-1 text-sm">
              {data.timePerQuestionTrend.slice(-10).map((p, i) => (
                <li key={`${p.label}-${i}`} className="flex justify-between">
                  <span>{p.label}</span>
                  <span className="font-medium text-ink">{p.avgResponseMs}ms</span>
                </li>
              ))}
              {data.timePerQuestionTrend.length === 0 ? <li>אין עדיין נתוני זמן.</li> : null}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardTitle>סקירות בוחנים אחרונות</CardTitle>
        <CardBody>
          <ul className="space-y-2 text-sm">
            {data.recentQuizAttempts.map((attempt) => (
              <li key={attempt.attemptId} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {attempt.quizId}
                  {attempt.scorePct != null ? ` · ${attempt.scorePct}%` : ""}
                </span>
                <Link
                  href={`/prep/amirant/course/review/${attempt.attemptId}`}
                  className="font-semibold text-primary"
                >
                  מעבר לסקירה
                </Link>
              </li>
            ))}
            {data.recentQuizAttempts.length === 0 ? <li>אין עדיין ניסיונות שנשמרו.</li> : null}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
