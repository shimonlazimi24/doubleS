"use client";

/**
 * Word formation (יצירת מילה): the learner types one word, built from the base
 * word under the sentence. Not multiple choice, so it has its own card; the
 * answers are checked on the server (/api/prep/amirant-course/grade-word).
 */
import { useEffect, useRef, useState } from "react";
import { PremiumMarkdownBody } from "@/components/prep/amirant-course/premium/PremiumMarkdownBody";
import { cn } from "@/lib/design-system/cn";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { showPrepToast } from "@/lib/prep/show-prep-toast";
import type { WordFormationGradeItem, WordFormationPublicItem } from "@/lib/amirant-course/word-formation/types";

type Props = {
  title: string;
  items: WordFormationPublicItem[];
  timeLimitSec?: number;
};

const BLANK = "________";

/** A short word for the result line; the specific note, if any, follows it. */
const VERDICT_LABEL: Record<WordFormationGradeItem["verdict"], string> = {
  correct: "נכון",
  known_mistake: "טעות נפוצה",
  capitalization: "אות גדולה / קטנה",
  base_word: "זו מילת הבסיס",
  wrong: "לא נכון",
  empty: "לא נענתה",
};

export function AmirantWordFormationCard({ title, items, timeLimitSec }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [gradeById, setGradeById] = useState<Record<string, WordFormationGradeItem>>({});
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(timeLimitSec ?? 0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!timerRunning || checked) return;
    const t = window.setInterval(() => setTimeLeftSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [timerRunning, checked]);

  const answeredCount = items.filter((q) => (answers[q.id] ?? "").trim()).length;
  const correctCount = Object.values(gradeById).filter((g) => g.isCorrect).length;

  const check = async () => {
    if (checking || answeredCount === 0) return;
    setChecking(true);
    setTimerRunning(false);
    try {
      const res = await fetch("/api/prep/amirant-course/grade-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: items.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })) }),
      });
      const data = (await res.json()) as { items?: WordFormationGradeItem[]; error?: string };
      if (!res.ok || !data.items) throw new Error(data.error ?? "grade_failed");
      setGradeById(Object.fromEntries(data.items.map((g) => [g.questionId, g])));
      setChecked(true);
    } catch (e) {
      showPrepToast(e instanceof Error && e.message !== "grade_failed" ? e.message : "בדיקת התשובות נכשלה. נסו שוב.", {
        tone: "error",
      });
    } finally {
      setChecking(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setGradeById({});
    setChecked(false);
    setTimeLeftSec(timeLimitSec ?? 0);
    setTimerRunning(false);
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted [direction:rtl]">השאלות לתרגול זה יתווספו בקרוב.</p>;
  }

  return (
    <div className="space-y-5 [direction:rtl]" lang="he">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line/70 bg-surface-low px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {items.length} שאלות · {answeredCount}/{items.length} נענו
            {checked ? ` · ${correctCount} נכונות` : ""}
          </p>
        </div>
        {timeLimitSec ? (
          timerRunning || checked || timeLeftSec !== timeLimitSec ? (
            <span
              className={cn(
                "font-mono text-2xl font-bold tabular-nums",
                timeLeftSec <= 30 && !checked ? "text-red-600" : "text-ink",
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
              התחל טיימר ({Math.round(timeLimitSec / 60)} דק׳)
            </button>
          )
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-muted">
        כתבו בשורה מילה אחת, בנויה מהמילה המודגשת. האיות נבדק בקפדנות (מתקבל גם איות בריטי), ואם החסר פותח את המשפט מתחילים
        באות גדולה.
      </p>

      <ol className="space-y-6">
        {items.map((q, qi) => {
          const typed = answers[q.id] ?? "";
          const g = gradeById[q.id];
          const [before, after] = q.sentence.split(BLANK);
          return (
            <li
              key={q.id}
              className={cn(
                "rounded-2xl border bg-paper p-5",
                checked ? (g?.isCorrect ? "border-emerald-300" : "border-red-300") : "border-line/80",
              )}
            >
              <p className="text-base font-medium leading-loose text-ink" dir="ltr">
                <span
                  className="me-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                  dir="rtl"
                >
                  {qi + 1}
                </span>
                {before}
                <span
                  className={cn(
                    "mx-0.5 inline-block min-w-[6.5rem] border-b-2 px-1 text-center font-semibold",
                    typed.trim() ? "border-primary text-primary" : "border-slate-400 text-transparent",
                  )}
                  aria-hidden
                >
                  {typed.trim() || "_"}
                </span>
                {after}
              </p>
              <p className="mt-2 text-sm text-slate-600" dir="ltr">
                <span className="font-bold tracking-wide text-ink">{q.baseWord}</span>
              </p>
              <label className="mt-4 flex items-center gap-3" dir="ltr">
                <span className="text-sm font-medium text-slate-500">Answer:</span>
                <input
                  ref={(el) => {
                    inputs.current[qi] = el;
                  }}
                  type="text"
                  value={typed}
                  disabled={checked || checking}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const next = inputs.current[qi + 1];
                    if (next) next.focus();
                    else void check();
                  }}
                  dir="ltr"
                  lang="en"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint={qi + 1 < items.length ? "next" : "done"}
                  aria-label={`תשובה לשאלה ${qi + 1}`}
                  className={cn(
                    "w-full max-w-xs rounded-xl border bg-paper px-4 py-2.5 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-default",
                    checked ? (g?.isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50") : "border-line/80",
                  )}
                />
              </label>

              {checked && g ? (
                <div
                  className={cn(
                    "mt-4 rounded-e-xl border-s-[3px] p-4",
                    g.isCorrect ? "border-emerald-600/70 bg-emerald-600/[0.05]" : "border-amber-500/80 bg-amber-500/[0.06]",
                  )}
                >
                  <p className={cn("text-sm font-bold", g.isCorrect ? "text-emerald-700" : "text-amber-800")}>
                    {g.isCorrect ? "✓" : "✗"} {VERDICT_LABEL[g.verdict]}
                    {!g.isCorrect ? (
                      <span className="font-normal text-slate-700">
                        {" "}
                        · התשובה: <span dir="ltr" className="font-bold text-ink">{g.accepted.join(" / ")}</span>
                      </span>
                    ) : null}
                  </p>
                  {g.note ? (
                    <div className="mt-2">
                      <PremiumMarkdownBody body={g.note} variant="card" />
                    </div>
                  ) : null}
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs font-semibold text-primary">הסבר מלא</summary>
                    <div className="mt-2">
                      <PremiumMarkdownBody body={g.explanation} variant="card" />
                    </div>
                  </details>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!checked ? (
        <button
          type="button"
          onClick={() => void check()}
          disabled={answeredCount === 0 || checking}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-card transition hover:opacity-90 disabled:opacity-40"
        >
          {checking ? "בודקים…" : `בדיקת תשובות (${answeredCount}/${items.length})`}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line/70 bg-surface-low px-5 py-4">
          <p className="text-lg font-bold text-ink">
            {correctCount}/{items.length} נכונות ({Math.round((correctCount / items.length) * 100)}%)
          </p>
          <button type="button" onClick={reset} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-primary">
            נסו שוב
          </button>
        </div>
      )}
    </div>
  );
}
