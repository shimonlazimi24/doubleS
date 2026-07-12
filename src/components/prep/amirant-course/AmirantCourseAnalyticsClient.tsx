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
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

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

  const hasData = Object.keys(analytics.byTopic).length > 0;

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-9" dir="rtl">
      <div>
        <Text as="h1" variant="titlePage">
          ההתקדמות שלי
        </Text>
        <Text as="p" variant="bodySm" className="mt-2 text-muted">
          איפה אתם חזקים, מה כדאי לחזק, ומה לעשות עכשיו.
        </Text>
      </div>

      {!hasData ? (
        /* empty state אחד מנחה - במקום "אין נתונים" מפוזר בכל סקשן */
        <div className="rounded-2xl border border-line bg-paper p-8 text-center">
          <Text as="p" variant="body" className="font-semibold text-ink">
            עוד אין כאן נתונים
          </Text>
          <Text as="p" variant="bodySm" className="mt-2 text-muted">
            השלימו מבחן רמה או תרגול ראשון - ותראו כאן דיוק לפי נושא, מגמת שיפור והמלצות אישיות.
          </Text>
          <Link
            href={`${COURSE_BASE}/quiz/quiz-entry-diagnostic`}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            למבחן הרמה ←
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-bold text-primary">דיוק לפי נושא</h2>
            <ul className="mt-3">
              {Object.entries(analytics.byTopic).map(([slug, roll]) => {
                const pct = roll.total > 0 ? Math.round((roll.correct / roll.total) * 100) : 0;
                return (
                  <li
                    key={slug}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line/60 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{topicLabel(slug)}</p>
                      <div className="mt-1.5 h-1.5 w-full max-w-[16rem] overflow-hidden rounded-full bg-surface-high">
                        <div
                          className={cn("h-full rounded-full", pct >= 70 ? "bg-emerald-500" : "bg-accent")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm tabular-nums text-muted">
                      {pct}% <span className="text-xs">({roll.correct}/{roll.total})</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="border-t border-line pt-6">
            <h2 className="text-lg font-bold text-primary">מה זה אומר</h2>
            <div className="mt-3 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted">כדאי לחזק</p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {weak.length ? (
                    weak.map((t) => <li key={t}>{topicLabel(t)}</li>)
                  ) : (
                    <li className="text-muted">צריך עוד קצת תרגול (3+ שאלות לנושא) כדי לזהות</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted">חזקים אצלכם</p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {strong.length ? (
                    strong.map((t) => <li key={t}>{topicLabel(t)}</li>)
                  ) : (
                    <li className="text-muted">עוד אין מספיק נתונים</li>
                  )}
                </ul>
              </div>
            </div>
            <Text as="p" variant="bodySm" className="mt-4 text-muted">
              {improvementHint}
            </Text>
          </section>

          <section className="border-t border-line pt-6">
            <h2 className="text-lg font-bold text-primary">המלצה אישית</h2>
            <Text as="p" variant="bodySm" className="mt-1 text-muted">
              ניתוח AI על בסיס הנתונים שלמעלה בלבד.
            </Text>
            <button
              type="button"
              disabled={aiLoading}
              onClick={runAi}
              className="mt-3 rounded-control bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50"
            >
              {aiLoading ? "מנתח…" : "מה כדאי לי לתרגל עכשיו?"}
            </button>
            {aiText ? (
              <div className="mt-4 rounded-e-xl border-s-[3px] border-accent/60 bg-accent-muted p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{aiText}</p>
              </div>
            ) : null}
          </section>
        </>
      )}

      <Link href={COURSE_BASE} className="inline-block text-sm font-semibold text-primary">
        ← חזרה לקורס
      </Link>
    </div>
  );
}
