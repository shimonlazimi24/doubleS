"use client";

import { loadAnalytics } from "@/lib/amirant-course";
import { Card, CardBody, CardTitle, Text } from "@/components/ui";

export function AmirantReviewFallbackClient() {
  const analytics = loadAnalytics();
  const quizSessions = analytics.sessions
    .filter((s) => s.kind === "quiz")
    .slice(-8)
    .reverse();

  return (
    <div className="space-y-6">
      <Text as="h1" variant="titlePage">
        סקירות בוחנים
      </Text>
      <Text as="p" variant="bodySm" className="text-muted">
        מוצג תקציר הניסיונות מהמכשיר הזה. התחברו כדי לקבל סקירה מלאה עם פירוט טעויות לכל שאלה.
      </Text>

      <Card>
        <CardTitle>נסיונות מקומיים אחרונים</CardTitle>
        <CardBody>
          <ul className="space-y-2 text-sm">
            {quizSessions.length ? (
              quizSessions.map((s, i) => (
                <li key={`${s.at}-${i}`} className="flex justify-between">
                  <span>{s.label}</span>
                  <span className="text-muted">
                    {s.scorePct != null ? `${Math.round(s.scorePct)}%` : "ללא ציון"}
                  </span>
                </li>
              ))
            ) : (
              <li>אין עדיין נסיונות מקומיים.</li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
