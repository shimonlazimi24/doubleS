import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import type { StudentDashboardData } from "@/lib/amirant-course/student-insights";
import { PREP_BASE } from "@/lib/prep/constants";
import { cn } from "@/lib/design-system/cn";

const COURSE = `${PREP_BASE}/amirant/course`;

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
}

/** Six segments, one per level, filled up to the learner's level. */
function LevelScale({ level }: { level: number }) {
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={cn("h-1.5 flex-1", i < level ? "bg-primary" : "bg-surface-high")} />
      ))}
    </span>
  );
}

const th = "pb-2 text-start text-xs font-bold text-muted";
const td = "border-t border-line/70 py-3 align-middle";

/**
 * The learner's progress page: one next step, a table of levels by topic, a
 * table of recent quizzes, three figures. Everything flat; the data is the
 * design.
 */
export function AmirantStudentDashboardView({ data }: { data: StudentDashboardData }) {
  const attempts = data.recentQuizAttempts;
  const hasAttempts = attempts.length > 0;
  const accuracyByTopic = new Map([...data.strongTopics, ...data.weakTopics].map((t) => [t.topic, t]));
  const avgAccuracy = data.accuracyOverTime.length
    ? Math.round(data.accuracyOverTime.reduce((s, p) => s + p.accuracyPct, 0) / data.accuracyOverTime.length)
    : null;
  const avgResponse = data.timePerQuestionTrend.length
    ? Math.round(data.timePerQuestionTrend.reduce((s, p) => s + p.avgResponseMs, 0) / data.timePerQuestionTrend.length / 1000)
    : null;
  const action = data.recommendedNextAction;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[56rem] px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[1.75rem] font-extrabold leading-tight text-ink sm:text-3xl">ההתקדמות שלי</h1>
        <p className="text-[15px] text-muted">
          {[
            action.progressLine,
            hasAttempts ? `${attempts.length} בוחנים` : null,
            avgAccuracy != null ? `דיוק ממוצע ${avgAccuracy}%` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* Next step: one row, one button */}
      <section aria-label="הצעד הבא" className="mt-8 flex flex-col gap-4 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted">הצעד הבא</p>
          <p className="mt-1 text-lg font-bold leading-snug text-ink">{action.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{action.description}</p>
        </div>
        <Link
          href={action.display.primaryHref}
          className="inline-flex h-[42px] shrink-0 items-center justify-center rounded bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          {action.display.primaryLabel}
        </Link>
      </section>

      {data.currentLevelByTopic.length > 0 ? (
        <section className="mt-10" aria-label="רמה לפי נושא">
          <h2 className="pb-3 text-base font-bold text-ink">רמה לפי נושא</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={cn(th, "w-[40%]")}>נושא</th>
                <th className={th}>רמה 1–6</th>
                <th className={cn(th, "w-16")}>רמה</th>
                <th className={cn(th, "w-20")}>דיוק</th>
              </tr>
            </thead>
            <tbody>
              {data.currentLevelByTopic.map((row) => {
                const acc = accuracyByTopic.get(row.topic);
                const accuracy = row.recentAccuracy ?? acc?.accuracy ?? null;
                return (
                  <tr key={row.topic}>
                    <td className={cn(td, "text-[15px] font-semibold text-ink")}>{row.topicLabel}</td>
                    <td className={cn(td, "pe-6")}>
                      <LevelScale level={row.level} />
                    </td>
                    <td className={cn(td, "text-sm tabular-nums text-ink")}>{row.level}</td>
                    <td className={cn(td, "text-sm tabular-nums text-muted")}>
                      {accuracy != null ? `${Math.round(accuracy * 100)}%` : "טרם נבדק"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {hasAttempts ? (
        <section className="mt-10" aria-label="בוחנים אחרונים">
          <div className="flex items-baseline justify-between pb-3">
            <h2 className="text-base font-bold text-ink">בוחנים אחרונים</h2>
            <Link href={`${COURSE}/review`} className="text-[13px] font-semibold text-primary underline-offset-4 hover:underline">
              כל ההיסטוריה
            </Link>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>בוחן</th>
                <th className={cn(th, "w-20")}>תאריך</th>
                <th className={cn(th, "w-16")}>ציון</th>
                <th className={cn(th, "w-16")}></th>
              </tr>
            </thead>
            <tbody>
              {attempts.slice(0, 8).map((a) => (
                <tr key={a.attemptId}>
                  <td className={cn(td, "text-[15px] font-semibold text-ink")}>{a.quizTitle}</td>
                  <td className={cn(td, "text-sm tabular-nums text-muted")}>{formatDate(a.submittedAt)}</td>
                  <td className={cn(td, "text-[15px] font-bold tabular-nums text-ink")}>{a.scorePct != null ? `${a.scorePct}%` : "—"}</td>
                  <td className={cn(td, "text-end")}>
                    <Link href={`${COURSE}/review/${a.attemptId}`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                      סקירה
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="mt-10 border-b border-line pb-8" aria-label="עוד אין נתונים">
          <p className="text-base font-bold text-ink">עדיין אין בוחנים</p>
          <p className="mt-1 text-sm text-muted">אחרי מבחן הרמה או בוחן ראשון יופיעו כאן הרמה לפי נושא והציונים.</p>
          <Link
            href={`${COURSE}/quiz/quiz-entry-diagnostic`}
            className="mt-4 inline-flex h-[42px] items-center justify-center rounded bg-primary px-5 text-sm font-bold text-white"
          >
            למבחן הרמה
          </Link>
        </section>
      )}

      {hasAttempts ? (
        <section className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-3" aria-label="מדדים">
          <div>
            <p className="text-xs text-muted">דיוק ממוצע</p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-ink">{avgAccuracy != null ? `${avgAccuracy}%` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">זמן ממוצע לשאלה</p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-ink">{avgResponse ? `${avgResponse} שנ׳` : "—"}</p>
            <p className="text-xs text-muted">היעד במבחן: 60</p>
          </div>
          <div>
            <p className="text-xs text-muted">בוחנים שהושלמו</p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-ink">{attempts.length}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
