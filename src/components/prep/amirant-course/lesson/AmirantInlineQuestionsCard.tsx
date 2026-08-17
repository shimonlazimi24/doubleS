"use client";

/**
 * שאלות אינטראקטיביות בתוך שיעור - מחליף את השאלות השטוחות שהודבקו מה-md:
 * שאלה, מתחתיה אפשרויות אחת מתחת לשנייה (לחיצות), טיימר אופציונלי שמתחיל
 * בלחיצה, בדיקת תשובות עם הסברים מהשרת.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  amirantExamQuestionPromptForDisplay,
  loadAnalytics,
  recordQuestionOutcome,
  recordSessionEnd,
  saveAnalytics,
} from "@/lib/amirant-course";
import {
  getClientPassage,
  getPublicBankQuestion,
} from "@/lib/amirant-course/question-bank/client-bank";
import { gradeBatchAnswers, type GradeBatchItem } from "@/lib/amirant-course/grade-client";
import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import { cn } from "@/lib/design-system/cn";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { showPrepToast } from "@/lib/prep/show-prep-toast";

type Props = {
  title: string;
  questionIds: string[];
  timeLimitSec?: number;
  /** תווית סשן לאנליטיקס (שם השיעור). */
  sessionLabel?: string;
};

export function AmirantInlineQuestionsCard({ title, questionIds, timeLimitSec, sessionLabel }: Props) {
  const questions = useMemo(
    () => questionIds.map((id) => getPublicBankQuestion(id)).filter((q): q is NonNullable<typeof q> => !!q),
    [questionIds],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [gradeById, setGradeById] = useState<Record<string, GradeBatchItem>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(timeLimitSec ?? 0);
  const analyticsRecorded = useRef(false);

  useEffect(() => {
    if (!timerRunning || checked) return;
    const t = window.setInterval(() => {
      setTimeLeftSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [timerRunning, checked]);

  const answeredCount = questions.filter((q) => answers[q.id]).length;

  const check = useCallback(() => {
    if (checking || questions.length === 0) return;
    setChecking(true);
    setTimerRunning(false);
    void gradeBatchAnswers(
      questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      })),
      true,
    )
      .then((batch) => {
        const byId = Object.fromEntries(batch.items.map((item) => [item.questionId, item]));
        setGradeById(byId);
        setCorrectCount(batch.correct);
        setChecked(true);

        if (analyticsRecorded.current) return;
        analyticsRecorded.current = true;
        try {
          let analytics = loadAnalytics();
          let localCorrect = 0;
          for (const q of questions) {
            const selected = answers[q.id];
            if (!selected) continue;
            const isCorrect = byId[q.id]?.isCorrect === true;
            if (isCorrect) localCorrect += 1;
            analytics = recordQuestionOutcome(analytics, {
              topicSlug: q.topicSlug,
              subtopicSlug: q.subtopicSlug,
              difficulty: q.difficulty,
              isCorrect,
            });
          }
          analytics = recordSessionEnd(analytics, {
            kind: "practice",
            label: sessionLabel ?? title,
            scorePct: Math.round((localCorrect / questions.length) * 100),
          });
          saveAnalytics(analytics);
        } catch {
          // אנליטיקס בלבד - לא חוסם את חוויית הבדיקה
        }
      })
      .catch(() => {
        showPrepToast("בדיקת התשובות נכשלה. נסו שוב.", { tone: "error" });
      })
      .finally(() => setChecking(false));
  }, [answers, checking, questions, sessionLabel, title]);

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted [direction:rtl]">השאלות לתרגול זה יתווספו בקרוב.</p>
    );
  }

  // קטעי קריאה: מקבצים שאלות לפי passageId ומציגים את הקטע פעם אחת לפני הקבוצה
  let lastPassageId: string | null = null;

  return (
    <div className="space-y-5 [direction:rtl]" lang="he">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-surface-low px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {questions.length} שאלות · {answeredCount}/{questions.length} נענו
            {checked ? ` · ${correctCount} נכונות` : ""}
          </p>
        </div>
        {timeLimitSec ? (
          timerRunning || checked || timeLeftSec !== timeLimitSec ? (
            <span
              className={cn(
                "font-mono text-2xl font-bold tabular-nums",
                timeLeftSec <= 60 && !checked ? "text-red-600" : "text-ink",
              )}
            >
              {formatClock(timeLeftSec)}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setTimerRunning(true)}
              className="rounded-xl border border-primary/40 bg-paper px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              ⏱️ התחל טיימר ({Math.round(timeLimitSec / 60)} דק׳)
            </button>
          )
        ) : null}
      </div>

      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const passage = q.passageId && q.passageId !== lastPassageId ? getClientPassage(q.passageId) : null;
          if (q.passageId) lastPassageId = q.passageId;
          const selected = answers[q.id];
          const graded = gradeById[q.id];
          const correctOptionId = graded?.correctOptionId ?? null;
          const isCorrect = checked && graded?.isCorrect === true;
          const isWrong = checked && selected != null && graded?.isCorrect === false;
          return (
            <li key={q.id} className="space-y-3">
              {passage ? (
                <div className="rounded-2xl border border-line/70 bg-surface-low p-4" dir="ltr">
                  {passage.title ? (
                    <p className="mb-2 text-sm font-semibold text-ink">{passage.title}</p>
                  ) : null}
                  <PremiumMarkdownBody body={passage.bodyMarkdown} variant="card" className="[direction:ltr] [&_*]:!text-start" />
                </div>
              ) : null}
              <div
                className={cn(
                  "rounded-2xl border bg-paper p-5",
                  isCorrect ? "border-emerald-300" : isWrong ? "border-red-300" : "border-line/80",
                )}
              >
                <p className="text-base font-medium leading-relaxed text-ink" dir="ltr">
                  <span className="me-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary" dir="rtl">
                    {qi + 1}
                  </span>
                  {amirantExamQuestionPromptForDisplay(q.prompt)}
                </p>
                <ul className="mt-4 space-y-2">
                  {q.options.map((opt) => {
                    const chosen = selected === opt.id;
                    const showAsCorrect = checked && correctOptionId != null && opt.id === correctOptionId;
                    const showAsWrong =
                      checked && chosen && correctOptionId != null && opt.id !== correctOptionId;
                    return (
                      <li key={opt.id}>
                        <button
                          type="button"
                          disabled={checked || checking}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                          }
                          dir="ltr"
                          className={cn(
                            "w-full rounded-xl border px-4 py-3 text-start text-sm transition disabled:cursor-default",
                            showAsCorrect
                              ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-900"
                              : showAsWrong
                                ? "border-red-400 bg-red-50 text-red-900"
                                : chosen
                                  ? "border-primary bg-primary/10 font-semibold text-primary"
                                  : "border-line/80 bg-paper hover:border-primary/40",
                          )}
                        >
                          {opt.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {checked && graded?.explanation ? (
                  // "הערת מורה" - קו עיפרון-אדום בשוליים, כמו סימון על דף בחינה
                  <div className="mt-4 rounded-e-xl border-s-[3px] border-pen/70 bg-pen/[0.04] p-4 ps-4">
                    <p className="mb-1.5 text-[11px] font-bold tracking-wide text-pen">הסבר</p>
                    <PremiumMarkdownBody body={graded.explanation} variant="card" />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {!checked ? (
        <button
          type="button"
          onClick={check}
          disabled={answeredCount === 0 || checking}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-card transition hover:opacity-90 disabled:opacity-40"
        >
          {checking ? "בודקים…" : `בדיקת תשובות (${answeredCount}/${questions.length})`}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line/70 bg-surface-low px-5 py-4">
          <p className="text-lg font-bold text-ink">
            {correctCount}/{questions.length} נכונות ({Math.round((correctCount / questions.length) * 100)}%)
          </p>
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setChecked(false);
              setGradeById({});
              setCorrectCount(0);
              setTimeLeftSec(timeLimitSec ?? 0);
              setTimerRunning(false);
              analyticsRecorded.current = false;
            }}
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary"
          >
            נסו שוב
          </button>
        </div>
      )}
    </div>
  );
}
