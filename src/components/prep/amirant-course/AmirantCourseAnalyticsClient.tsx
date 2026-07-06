"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  loadAnalytics,
  strongTopics,
  weakTopics,
} from "@/lib/amirant-course";
import { AMIRANT_TOPIC_LABEL_HE } from "@/lib/amirant-course/topic-labels";
import type { AmirantBankTopicSlug } from "@/lib/amirant-course/types/bank-question";
import { PREP_BASE } from "@/lib/prep/constants";
import { Card, CardBody, Text } from "@/components/ui";

const COURSE_BASE = `${PREP_BASE}/amirant/course`;

function topicLabel(slug: string): string {
  return AMIRANT_TOPIC_LABEL_HE[slug as AmirantBankTopicSlug] ?? slug;
}

export function AmirantCourseAnalyticsClient() {
  const analytics = useMemo(() => loadAnalytics(), []);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const weak = weakTopics(analytics, 3);
  const strong = strongTopics(analytics, 3);

  const improvementHint = useMemo(() => {
    const s = analytics.sessions.filter((x) => x.scorePct != null).map((x) => x.scorePct!);
    if (s.length < 2) return "אין עדיין מספיק מבחנים עם ציון לחישוב מגמה.";
    const mid = Math.floor(s.length / 2);
    const a = s.slice(0, mid);
    const b = s.slice(mid);
    const avg = (arr: number[]) => (arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0);
    const da = avg(a);
    const db = avg(b);
    if (db > da + 3) return `מגמת ציונים בעליה: ממוצע תקופה מאוחרת ${db.toFixed(0)}% לעומת ${da.toFixed(0)}% בתחילה.`;
    if (da > db + 3) return `מגמת ציונים בירידה: כדאי לחזור על נושאים חלשים.`;
    return "מגמת ציונים יציבה יחסית בין מבחנים אחרונים.";
  }, [analytics.sessions]);

  async function runAi() {
    setAiLoading(true);
    setAiText(null);
    try {
      const res = await fetch("/api/prep/amirant-course/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weakTopics: weak,
          strongTopics: strong,
          byTopic: analytics.byTopic,
          sessionsSample: analytics.sessions.slice(-8),
          improvementHint,
        }),
      });
      const data = (await res.json()) as {
        priorities?: string[];
        weeklyPlan?: string[];
        why?: string;
        safeFallback?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setAiText(typeof data.error === "string" ? data.error : "בקשה נדחתה.");
        return;
      }
      const lines = [
        `מיקוד: ${(data.priorities ?? []).join(" | ") || "ללא"}`,
        ...((data.weeklyPlan ?? []).map((x, i) => `${i + 1}. ${x}`) || []),
        data.why ? `הסבר: ${data.why}` : "",
        data.safeFallback ? "הערה: תשובת fallback בטוחה (הקשר חלקי)." : "",
      ].filter(Boolean);
      setAiText(lines.join("\n"));
    } catch {
      setAiText("שגיאת רשת.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Text as="h1" variant="titlePage">
        אנליטיקה — הכנה לאמירנט
      </Text>
      <Text as="p" variant="bodySm" className="text-muted">
        נתונים מקומיים בדפדפן בלבד. אין המצאת ציונים — ה-AI מקבל רק את מה שמוצג כאן.
      </Text>

      <Card>
        <CardBody className="space-y-4 p-6">
          <Text as="h2" variant="headlineSm">
            דיוק לפי נושא
          </Text>
          <ul className="space-y-2 text-sm">
            {Object.entries(analytics.byTopic).map(([slug, roll]) => {
              const pct = roll.total > 0 ? Math.round((roll.correct / roll.total) * 100) : 0;
              const avgMs =
                roll.responseTimeSamples && roll.responseTimeSamples > 0 && roll.responseTimeMsSum != null
                  ? Math.round(roll.responseTimeMsSum / roll.responseTimeSamples)
                  : null;
              return (
                <li key={slug} className="flex flex-wrap justify-between gap-2 border-b border-line/40 py-2 last:border-0">
                  <span className="font-medium">{topicLabel(slug)}</span>
                  <span className="text-muted">
                    {roll.correct}/{roll.total} ({pct}%)
                    {avgMs != null ? ` · ממוצע זמן ~${avgMs}ms` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          {Object.keys(analytics.byTopic).length === 0 ? <Text as="p" variant="bodySm">אין עדיין נתונים — התחילו מבחן או תרגול.</Text> : null}
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody className="p-6">
            <Text as="h3" variant="headlineSm" className="mb-2">
              נושאים לחיזוק
            </Text>
            <ul className="list-disc pr-5 text-sm text-ink">
              {weak.length ? weak.map((t) => <li key={t}>{topicLabel(t)}</li>) : <li>אין מספיק ניסיון (לפחות 3 ניסיונות לנושא).</li>}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6">
            <Text as="h3" variant="headlineSm" className="mb-2">
              נושאים חזקים
            </Text>
            <ul className="list-disc pr-5 text-sm text-ink">
              {strong.length ? strong.map((t) => <li key={t}>{topicLabel(t)}</li>) : <li>אין מספיק ניסיון.</li>}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-2 p-6">
          <Text as="h3" variant="headlineSm">
            שיפור לאורך זמן
          </Text>
          <Text as="p" variant="body">{improvementHint}</Text>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4 p-6">
          <Text as="h3" variant="headlineSm">
            סיכום AI (מבוסס נתונים בלבד)
          </Text>
          <button
            type="button"
            disabled={aiLoading}
            onClick={runAi}
            className="rounded-control bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {aiLoading ? "טוען…" : "בקשת ניתוח"}
          </button>
          {aiText ? (
            <pre className="whitespace-pre-wrap rounded-control border border-line/60 bg-surface-low p-4 text-sm leading-relaxed text-ink">
              {aiText}
            </pre>
          ) : null}
        </CardBody>
      </Card>

      <Link href={COURSE_BASE} className="inline-block text-sm font-semibold text-primary">
        חזרה לקורס
      </Link>
    </div>
  );
}
