"use client";

/**
 * The writing task (מטלת כתיבה): the question, a 12-minute clock that starts
 * on the first keystroke, an editor with a live word count, and the verdict
 * from the server grader: two levels as the exam gives them, what worked,
 * what to fix, one sentence upgraded. The task's three reference essays and
 * its rubric open only after a submission, as in the printed booklet.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { cn } from "@/lib/design-system/cn";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { PREP_BASE } from "@/lib/prep/constants";
import {
  countWords,
  WRITING_LEVEL_HE,
  WRITING_LIMITS,
  type WritingGradeResult,
  type WritingGuidePublic,
  type WritingLevel,
  type WritingSubmission,
  type WritingTaskPublic,
} from "@/lib/amirant-course/writing/types";

type Props = {
  task: WritingTaskPublic;
  guide: WritingGuidePublic;
  canSubmit: boolean;
};

const LEVEL_ORDER: WritingLevel[] = ["low", "mid", "high"];

function levelTone(level: WritingLevel): string {
  if (level === "high") return "text-emerald-700";
  if (level === "mid") return "text-amber-700";
  return "text-red-700";
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AmirantWritingTaskCard({ task, guide, canSubmit }: Props) {
  const timeLimitSec = task.minutes * 60;
  const [text, setText] = useState("");
  const [started, setStarted] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(timeLimitSec);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<WritingSubmission | null>(null);
  const [history, setHistory] = useState<WritingSubmission[]>([]);
  const [view, setView] = useState<"write" | "result">("write");
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const words = useMemo(() => countWords(text), [text]);
  const [minWords, maxWords] = task.wordRange;
  const inRange = words >= minWords && words <= maxWords;
  const timeUp = started && timeLeftSec === 0;

  useEffect(() => {
    if (!started || submitting || view === "result") return;
    const t = window.setInterval(() => setTimeLeftSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [started, submitting, view]);

  const loadHistory = useCallback(async () => {
    if (!canSubmit) return;
    try {
      const res = await fetch(`/api/prep/amirant-course/writing/submissions?taskId=${encodeURIComponent(task.id)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { submissions?: WritingSubmission[] };
      setHistory(data.submissions ?? []);
    } catch {
      /* history is a convenience; the task works without it */
    }
  }, [canSubmit, task.id]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const submit = async () => {
    if (submitting || words < WRITING_LIMITS.minWordsToGrade) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/prep/amirant-course/writing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, text }),
      });
      const data = (await res.json()) as { submission?: WritingSubmission; error?: string };
      if (!res.ok || !data.submission?.result) throw new Error(data.error ?? "הבדיקה לא הצליחה. נסו שוב.");
      setCurrent(data.submission);
      setView("result");
      setHistory((h) => [data.submission!, ...h.filter((x) => x.id !== data.submission!.id)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "הבדיקה לא הצליחה. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitBlockedReason =
    !canSubmit
      ? "הבדיקה זמינה בגישה המלאה לקורס."
      : words < WRITING_LIMITS.minWordsToGrade
        ? `לבדיקה צריך לפחות ${WRITING_LIMITS.minWordsToGrade} מילים (עכשיו ${words}).`
        : null;

  const backToEditor = () => {
    setView("write");
    setTimeout(() => editorRef.current?.focus(), 0);
  };

  return (
    <div className="space-y-6 [direction:rtl]" lang="he">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-surface border border-line/70 bg-surface-low px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">מטלת כתיבה {task.n}</p>
          <p className="mt-0.5 text-xs text-muted">
            {minWords}–{maxWords} מילים · {task.minutes} דקות · שני ממדים: תוכן וארגון, שפה
          </p>
        </div>
        <span
          className={cn("font-mono text-2xl font-bold tabular-nums", timeUp ? "text-red-600" : started && timeLeftSec <= 60 ? "text-amber-700" : "text-ink")}
          aria-live={timeUp ? "polite" : "off"}
        >
          {formatClock(timeLeftSec)}
        </span>
      </div>

      <section className="rounded-surface border border-line/80 bg-paper p-5">
        <p className="text-sm text-muted">Write a response to the topic below.</p>
        <p className="mt-2 text-lg font-medium leading-relaxed text-ink" dir="ltr" lang="en">
          {task.prompt}
        </p>
        <p className="mt-3 text-sm text-muted" dir="ltr" lang="en">
          Write {minWords}–{maxWords} words · {task.minutes} minutes · Stay on topic, organize your ideas, and check grammar, capital letters and punctuation.
        </p>
      </section>

      <details className="group rounded-surface border border-line/70 bg-paper">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">התוכנית ל-12 דקות, השיטה למטלה הזאת וביטויים שימושיים</span>
          <span className="hidden group-open:inline">סגירה</span>
        </summary>
        <div className="space-y-5 border-t border-line/70 px-5 py-4 text-[15px] leading-relaxed">
          <div>
            <p className="font-bold text-ink">התוכנית</p>
            <ul className="mt-1.5 list-disc space-y-1 pe-5 text-muted">
              {guide.planHe.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          {task.method.map((m) => (
            <div key={m.titleHe}>
              <p className="font-bold text-ink">{m.titleHe}</p>
              <p className="mt-1 text-muted">{m.bodyHe}</p>
            </div>
          ))}
          <div>
            <p className="font-bold text-ink">ביטויים שימושיים לנושא</p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-ink" dir="ltr" lang="en">
              {task.usefulPhrases.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-ink">בדיקה אחרונה לפני ההגשה</p>
            <ul className="mt-1.5 list-disc space-y-1 pe-5 text-muted">
              {guide.finalCheckHe.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      {view === "write" ? (
        <section className="space-y-3">
          <label htmlFor={`writing-${task.id}`} className="block text-sm font-semibold text-ink">
            החיבור שלכם
          </label>
          <textarea
            id={`writing-${task.id}`}
            ref={editorRef}
            dir="ltr"
            lang="en"
            spellCheck={false}
            autoCorrect="off"
            value={text}
            disabled={submitting}
            onChange={(e) => {
              if (!started && e.target.value.trim()) setStarted(true);
              setText(e.target.value);
            }}
            placeholder="Type your response here."
            className="min-h-[14rem] w-full resize-y rounded-surface border border-line bg-paper px-4 py-3 text-base leading-relaxed text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={cn("text-sm tabular-nums", inRange ? "text-muted" : words === 0 ? "text-muted" : "text-amber-700")} aria-live="polite">
              {words} מילים
              {words > 0 && words < minWords ? ` · מתחת ל-${minWords}` : ""}
              {words > maxWords ? ` · מעל ${maxWords}` : ""}
              {timeUp ? " · הזמן נגמר, אפשר לשלוח" : ""}
            </p>
            <div className="flex items-center gap-3">
              {submitBlockedReason ? <span className="text-xs text-muted">{submitBlockedReason}</span> : null}
              {!canSubmit ? (
                <Link href={`${PREP_BASE}/pricing`} className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
                  לרכישת גישה
                </Link>
              ) : null}
              <button
                type="button"
                onClick={submit}
                disabled={Boolean(submitBlockedReason) || submitting}
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? "בודקים…" : "שליחה לבדיקה"}
              </button>
            </div>
          </div>
          {submitting ? (
            <div className="flex items-center gap-3 rounded-surface border border-line/70 bg-surface-low px-4 py-3 text-sm text-ink" role="status">
              <span
                aria-hidden
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary motion-reduce:animate-none"
              />
              המשוב מוכן תוך דקה. הבודק קורא את החיבור מול המחוון של המטלה.
            </div>
          ) : null}
          {error ? (
            <p className="rounded-surface border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      ) : current?.result ? (
        <ResultView
          submission={current}
          task={task}
          guide={guide}
          onRewrite={backToEditor}
        />
      ) : null}

      {history.length > 0 ? (
        <section className="rounded-surface border border-line/70 bg-paper">
          <p className="border-b border-line/70 px-5 py-3 text-sm font-semibold text-ink">הגשות קודמות למטלה הזאת</p>
          <ul className="divide-y divide-line/70">
            {history.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!s.result) return;
                    setCurrent(s);
                    setView("result");
                  }}
                  disabled={!s.result}
                  className="flex min-h-11 w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-2.5 text-start text-sm hover:bg-surface-low disabled:cursor-default"
                >
                  <span className="text-muted">{formatDate(s.createdAt)}</span>
                  <span className="tabular-nums text-muted">{s.wordCount} מילים</span>
                  {s.result ? (
                    <span className="text-ink">
                      תוכן: <b className={levelTone(s.result.content.level)}>{WRITING_LEVEL_HE[s.result.content.level]}</b> · שפה:{" "}
                      <b className={levelTone(s.result.language.level)}>{WRITING_LEVEL_HE[s.result.language.level]}</b>
                    </span>
                  ) : (
                    <span className="text-muted">{s.status === "failed" ? "הבדיקה נכשלה" : "בבדיקה"}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ResultView({
  submission,
  task,
  guide,
  onRewrite,
}: {
  submission: WritingSubmission;
  task: WritingTaskPublic;
  guide: WritingGuidePublic;
  onRewrite: () => void;
}) {
  const r = submission.result as WritingGradeResult;
  const overall = LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(r.content.level), LEVEL_ORDER.indexOf(r.language.level))];
  return (
    <section className="space-y-5">
      <div className="rounded-surface border border-line/80 bg-paper p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-lg font-bold text-ink">המשוב</h3>
          <p className="text-sm tabular-nums text-muted">
            {r.wordCount} מילים
            {r.tooShort ? ` · מתחת ל-${task.wordRange[0]}` : ""}
            {r.tooLong ? " · ארוך מהנדרש" : ""}
          </p>
        </div>
        <dl className="mt-4 divide-y divide-line/70 border-y border-line/70">
          <div className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_6rem_1fr]">
            <dt className="font-semibold text-ink">תוכן וארגון</dt>
            <dd className={cn("font-bold", levelTone(r.content.level))}>רמה {WRITING_LEVEL_HE[r.content.level]}</dd>
            <dd className="text-[15px] leading-relaxed text-muted">{r.content.whyHe}</dd>
          </div>
          <div className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[11rem_6rem_1fr]">
            <dt className="font-semibold text-ink">שפה: עושר ודיוק</dt>
            <dd className={cn("font-bold", levelTone(r.language.level))}>רמה {WRITING_LEVEL_HE[r.language.level]}</dd>
            <dd className="text-[15px] leading-relaxed text-muted">{r.language.whyHe}</dd>
          </div>
        </dl>
        {!r.onTopic ? (
          <p className="mt-3 text-sm text-red-700">התשובה לא עונה על השאלה שנשאלה. במבחן זה פוגע קשות בממד התוכן.</p>
        ) : null}
        <p className="mt-3 text-sm text-muted">
          במבחן שני הממדים מדווחים בנפרד; הרמה הנמוכה מביניהם ({WRITING_LEVEL_HE[overall]}) היא מה שכדאי לשפר קודם.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-surface border border-line/80 bg-paper p-5">
          <p className="font-bold text-ink">מה עבד</p>
          <ul className="mt-2 list-disc space-y-1.5 pe-5 text-[15px] leading-relaxed text-muted">
            {r.workedHe.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-surface border border-line/80 bg-paper p-5">
          <p className="font-bold text-ink">מה לתקן, לפי סדר חשיבות</p>
          <ol className="mt-2 list-decimal space-y-1.5 pe-5 text-[15px] leading-relaxed text-muted">
            {r.fixHe.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-surface border border-line/80 bg-paper p-5">
        <p className="font-bold text-ink">משפט אחד ברמה גבוהה יותר</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted" dir="ltr" lang="en">
          {r.upgradedSentence.original}
        </p>
        <p className="mt-1 text-[15px] font-medium leading-relaxed text-ink" dir="ltr" lang="en">
          {r.upgradedSentence.better}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{r.upgradedSentence.whyHe}</p>
      </div>

      {r.flaggedErrors.length > 0 ? (
        <div className="rounded-surface border border-line/80 bg-paper p-5">
          <p className="font-bold text-ink">טעויות נפוצות של דוברי עברית שהופיעו בחיבור</p>
          <ul className="mt-2 divide-y divide-line/70">
            {r.flaggedErrors.map((e) => (
              <li key={e.found} className="grid gap-x-6 gap-y-1 py-2.5 sm:grid-cols-[1fr_1fr_1.4fr]">
                <span className="text-[15px] text-red-700 line-through decoration-red-300" dir="ltr" lang="en">
                  {e.found}
                </span>
                <span className="text-[15px] font-medium text-ink" dir="ltr" lang="en">
                  {e.write}
                </span>
                <span className="text-sm text-muted">{e.noteHe}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-surface border border-line/80 bg-paper p-5">
        <p className="font-bold text-ink">החיבור שנבדק</p>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink" dir="ltr" lang="en">
          {submission.text}
        </p>
      </div>

      <details className="group rounded-surface border border-line/70 bg-paper">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">חיבורים לדוגמה בשלוש רמות</span>
          <span className="hidden group-open:inline">סגירת החיבורים לדוגמה</span>
        </summary>
        <div className="divide-y divide-line/70 border-t border-line/70">
          {[...task.samples]
            .sort((a, b) => LEVEL_ORDER.indexOf(b.level) - LEVEL_ORDER.indexOf(a.level))
            .map((s) => (
              <div key={s.level} className="px-5 py-4">
                <p className="text-sm font-bold text-ink">
                  רמה {WRITING_LEVEL_HE[s.level]} <span className="font-normal text-muted">({s.statedWords} מילים)</span>
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink" dir="ltr" lang="en">
                  {s.essay}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.analysisHe}</p>
              </div>
            ))}
          {task.words.length > 0 ? (
            <div className="px-5 py-4">
              <p className="text-sm font-bold text-ink">מילים לשינון</p>
              <ul className="mt-1.5 space-y-1 text-[15px] text-muted">
                {task.words.map((w) => (
                  <li key={w.word}>
                    <span className="font-medium text-ink" dir="ltr" lang="en">
                      {w.word}
                    </span>
                    {w.pronunciation ? <span className="text-muted"> [{w.pronunciation}]</span> : null} · {w.meaningHe}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </details>

      <details className="group rounded-surface border border-line/70 bg-paper">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">המחוון של המטלה</span>
          <span className="hidden group-open:inline">סגירת המחוון</span>
        </summary>
        <div className="space-y-4 border-t border-line/70 px-5 py-4">
          {(["content", "language"] as const).map((dim) => (
            <div key={dim}>
              <p className="font-bold text-ink">{dim === "content" ? "תוכן וארגון" : "שפה: עושר ודיוק"}</p>
              <dl className="mt-1.5 divide-y divide-line/70">
                {LEVEL_ORDER.map((level) => (
                  <div key={level} className="grid gap-x-4 py-2 sm:grid-cols-[6rem_1fr]">
                    <dt className={cn("font-semibold", levelTone(level))}>רמה {WRITING_LEVEL_HE[level]}</dt>
                    <dd className="text-[15px] leading-relaxed text-muted">{task.rubric[dim][level]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <div>
            <p className="font-bold text-ink">מה יש בתשובה ברמה גבוהה</p>
            <ul className="mt-1.5 list-disc space-y-1 pe-5 text-[15px] leading-relaxed text-muted">
              {guide.checklistHe.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRewrite}
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white transition hover:opacity-90"
        >
          לכתוב שוב עם התיקונים
        </button>
      </div>
    </section>
  );
}
