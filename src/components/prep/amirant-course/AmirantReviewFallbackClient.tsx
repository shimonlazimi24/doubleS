"use client";

import Link from "next/link";
import { loadAnalytics } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";
import { Text } from "@/components/ui";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

export function AmirantReviewFallbackClient() {
  const analytics = loadAnalytics();
  const quizSessions = analytics.sessions
    .filter((s) => s.kind === "quiz")
    .slice(-8)
    .reverse();

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-8" dir="rtl">
      <div>
        <Text as="h1" variant="titlePage">
          סקירות בוחנים
        </Text>
        <Text as="p" variant="bodySm" className="mt-2 text-muted">
          תקציר הניסיונות מהמכשיר הזה. עם התחברות תקבלו סקירה מלאה עם פירוט טעויות לכל שאלה.
        </Text>
      </div>

      {quizSessions.length === 0 ? (
        /* empty state מנחה אחד - לא "אין נתונים" יבש */
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
            למבחן הרמה ←
          </Link>
        </div>
      ) : (
        <section>
          <h2 className="text-lg font-bold text-primary">נסיונות אחרונים במכשיר זה</h2>
          <ul className="mt-3">
            {quizSessions.map((s, i) => (
              <li
                key={`${s.at}-${i}`}
                className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-0"
              >
                <span className="text-sm font-medium text-ink">{s.label}</span>
                <span className="text-sm tabular-nums text-muted">
                  {s.scorePct != null ? `${Math.round(s.scorePct)}%` : "ללא ציון"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            לפירוט טעויות מלא לכל שאלה -{" "}
            <Link href={`${PREP_BASE}/login?next=${COURSE_BASE}/review`} className="font-semibold text-primary hover:underline">
              התחברו
            </Link>
            .
          </p>
        </section>
      )}

      <Link href={COURSE_BASE} className="inline-block text-sm font-semibold text-primary">
        ← חזרה לקורס
      </Link>
    </div>
  );
}
