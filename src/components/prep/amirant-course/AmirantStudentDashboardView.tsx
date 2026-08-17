import Link from "next/link";
import type { StudentDashboardData } from "@/lib/amirant-course/student-insights";
import { AmirantNextBestActionCard } from "@/components/prep/amirant-course/AmirantNextBestActionCard";
import { PREP_BASE } from "@/lib/prep/constants";

const COURSE = `${PREP_BASE}/amirant/course`;

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function AccuracyBar({ accuracy }: { accuracy: number }) {
  const p = Math.round(accuracy * 100);
  const color =
    p >= 75 ? "bg-emerald-500" : p >= 50 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-high">
        <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${p}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-primary">{p}%</span>
    </div>
  );
}

/** תא בתוך רצועת סטטים אחת - לא כרטיס נפרד לכל מספר (DESIGN_GUIDELINES: cards). */
function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-3.5 text-center">
      <p className="font-display text-2xl font-bold tabular-nums text-primary">{value}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">{label}</p>
    </div>
  );
}

export function AmirantStudentDashboardView({ data }: { data: StudentDashboardData }) {
  const hasTopicData = data.weakTopics.length > 0 || data.strongTopics.length > 0;
  const hasLevelData = data.currentLevelByTopic.length > 0;
  const hasAttempts = data.recentQuizAttempts.length > 0;
  const hasAccuracy = data.accuracyOverTime.length > 0;

  return (
    <div dir="rtl" className="space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-primary-container px-6 py-7 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-score">
          לוח תלמיד
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold leading-snug md:text-3xl">
          שלום - הנה התמונה שלך
        </h1>
        <p className="mt-1.5 text-sm text-white/65">
          מעקב התקדמות, המלצות ונושאים לחיזוק - הכל במקום אחד.
        </p>
        <Link
          href={data.recommendedNextAction.href ?? COURSE}
          className="mt-5 inline-flex items-center justify-center rounded-control bg-score px-5 py-2.5 text-sm font-bold text-primary transition hover:opacity-90"
        >
          {data.recommendedNextAction.ctaLabel ?? "המשך ללמוד"} ←
        </Link>
      </div>

      {/* ── Next best action ── */}
      <AmirantNextBestActionCard action={data.recommendedNextAction} />

      {/* ── Stats ── */}
      {hasAccuracy && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-score">
            ביצועים
          </p>
          <div className="grid grid-cols-3 divide-x divide-x-reverse divide-line rounded-2xl border border-line bg-paper shadow-sm [direction:rtl]">
            <StatChip
              value={`${data.accuracyOverTime.at(-1)?.accuracyPct ?? 0}%`}
              label="דיוק אחרון"
            />
            <StatChip
              value={String(data.recentQuizAttempts.length)}
              label="בוחנים שהושלמו"
            />
            <StatChip
              value={data.currentLevelByTopic[0] ? `${data.currentLevelByTopic[0].level}` : "-"}
              label="רמה נוכחית"
            />
          </div>
        </div>
      )}

      {/* ── Topic performance ── */}
      {hasTopicData && (
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-score">
            ביצועים לפי נושא
          </p>
          <div className="space-y-4">
            {[...data.strongTopics, ...data.weakTopics]
              .filter((v, i, arr) => arr.findIndex((x) => x.topic === v.topic) === i)
              .slice(0, 6)
              .map((row) => (
                <div key={row.topic}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">{row.topicLabel}</span>
                    <span className="text-xs text-muted">
                      {row.totalCorrect}/{row.totalAnswered}
                    </span>
                  </div>
                  <AccuracyBar accuracy={row.accuracy} />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Level by topic ── */}
      {hasLevelData && (
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-score">
            רמה לפי נושא
          </p>
          {/* שורות עם קו מפריד במקום קופסה-בתוך-כרטיס */}
          <div className="divide-y divide-line">
            {data.currentLevelByTopic.map((row) => (
              <div
                key={row.topic}
                className="flex items-center justify-between px-1 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium text-primary">{row.topicLabel}</span>
                <div className="flex items-center gap-2">
                  {row.recentAccuracy != null && (
                    <span className="text-xs text-muted">
                      {Math.round(row.recentAccuracy * 100)}%
                    </span>
                  )}
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
                    רמה {row.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Accuracy trend ── */}
      {hasAccuracy && data.accuracyOverTime.length >= 3 && (
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-score">
            מגמת דיוק
          </p>
          <div className="flex h-20 items-end gap-1.5">
            {data.accuracyOverTime.slice(-10).map((p, i) => (
              <div key={i} className="group relative flex-1">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-primary to-accent opacity-80 transition-opacity group-hover:opacity-100"
                  style={{ height: `${p.accuracyPct}%` }}
                />
                <p className="absolute -bottom-5 w-full text-center text-[0.6rem] text-muted">
                  {p.label.slice(0, 3)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-line pt-4">
            <p className="text-xs text-muted">
              ממוצע: {Math.round(data.accuracyOverTime.reduce((s, p) => s + p.accuracyPct, 0) / data.accuracyOverTime.length)}%
            </p>
          </div>
        </div>
      )}

      {/* ── Recent quizzes ── */}
      {hasAttempts && (
        <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-score">
            בוחנים אחרונים
          </p>
          <div className="space-y-3">
            {data.recentQuizAttempts.slice(0, 6).map((attempt) => {
              const score = attempt.scorePct;
              const scoreColor =
                score == null ? "bg-surface-high text-muted"
                : score >= 75 ? "bg-emerald-100 text-emerald-800"
                : score >= 50 ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800";
              return (
                <div
                  key={attempt.attemptId}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-low px-4 py-3"
                >
                  <span className="text-sm text-primary">{attempt.quizId}</span>
                  <div className="flex items-center gap-3">
                    {score != null && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreColor}`}>
                        {score}%
                      </span>
                    )}
                    <Link
                      href={`${COURSE}/review/${attempt.attemptId}`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      סקירה ←
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!hasTopicData && !hasAttempts && (
        <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-12 text-center">
          <p className="text-2xl">◈</p>
          <p className="mt-3 font-semibold text-primary">עדיין אין נתונים</p>
          <p className="mt-1.5 text-sm text-muted">
            השלם בוחן ראשון כדי לראות ביצועים, רמה והמלצות.
          </p>
          <Link
            href={COURSE}
            className="mt-5 inline-flex items-center justify-center rounded-control bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            התחל ללמוד ←
          </Link>
        </div>
      )}

    </div>
  );
}
