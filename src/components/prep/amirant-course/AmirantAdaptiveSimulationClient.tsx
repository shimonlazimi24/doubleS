"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AttemptReport, AttemptSummary, ClientSection } from "@/lib/amirant-course/simulations/adaptive/types";
import { amirantExamQuestionPromptForDisplay } from "@/lib/amirant-course";
import { formatClock } from "@/lib/amirant-course/format-clock";
import { countWords } from "@/lib/amirant-course/writing/types";
import { PREP_BASE } from "@/lib/prep/constants";
import { cn } from "@/lib/design-system/cn";
import { QuizOptionContent } from "./quiz/QuizOptionContent";
import { QuizOptionButton, QuizOptionGroup } from "./quiz/QuizOptionGroup";
import { QuizTimeAnnouncer } from "./quiz/QuizTimeAnnouncer";
import { QuizPassagePanel } from "./quiz/QuizPassagePanel";
import { showPrepToast } from "@/lib/prep/show-prep-toast";
import { dispatchAmirantQuestionContext } from "@/lib/prep/amirant-lesson-coach-events";
import type { ClientQuestion, PoolItemType } from "@/lib/amirant-course/simulations/adaptive/types";

/** Pool section types in the bank's vocabulary - the assistant's retrieval filter and hint staging use those. */
const POOL_TYPE_TO_BANK_TOPIC: Partial<Record<PoolItemType, string>> = {
  sentence_completion: "sentence_completion",
  restatement: "rephrasing",
  reading_set: "reading_comprehension",
};

const COURSE_BASE = `${PREP_BASE}/amirant/course`;
const API = "/api/prep/amirant-course/simulation/adaptive";

type Phase = "intro" | "running" | "finishing" | "summary";

type StepResponse = {
  token: string | null;
  section: ClientSection | null;
  report?: AttemptReport;
  error?: string;
};

async function call(body: Record<string, unknown>): Promise<StepResponse> {
  const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as StepResponse;
  if (!res.ok) throw new Error(json.error ?? "הפעולה נכשלה");
  return json;
}

const LEVEL_HE = { low: "נמוכה", mid: "בינונית", high: "גבוהה" } as const;

const btnPrimary = "inline-flex min-h-11 items-center justify-center rounded bg-primary px-6 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40";
const btnSecondary = "inline-flex min-h-11 items-center justify-center rounded border border-line bg-paper px-5 text-sm font-semibold text-primary transition hover:border-primary/40";

/**
 * The adaptive simulation: the exam's six scored sections and the experimental
 * part, assembled from the owner's pool one step at a time by the server.
 * The browser holds a signed token and the current step only.
 */
export function AmirantAdaptiveSimulationClient({ attempts, persistent }: { attempts: AttemptSummary[]; persistent: boolean }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [token, setToken] = useState<string | null>(null);
  const [section, setSection] = useState<ClientSection | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [typed, setTyped] = useState("");
  const [essay, setEssay] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<AttemptReport | null>(null);
  const [history, setHistory] = useState(attempts);
  const sectionKey = section ? `${section.plan.index}:${section.position}` : "";
  const timedOutFor = useRef("");

  const applyStep = useCallback((r: StepResponse) => {
    if (r.report) {
      setReport(r.report);
      setHistory((h) => [
        { attemptId: r.report!.attemptId ?? "", finishedAt: r.report!.finishedAt, score: r.report!.score, low: r.report!.low, high: r.report!.high, bandHe: r.report!.bandHe, finalLevel: r.report!.finalLevel },
        ...h,
      ]);
      setToken(null);
      setSection(null);
      setPhase("summary");
      return;
    }
    setToken(r.token);
    setSection(r.section);
    setSecondsLeft(r.section?.secondsLeft ?? 0);
    setAnswers({});
    setTyped("");
    setEssay("");
    setPhase("running");
  }, []);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      applyStep(await call({ action: "start" }));
    } catch (e) {
      showPrepToast(e instanceof Error ? e.message : "התחלת הסימולציה נכשלה", { tone: "error" });
    } finally {
      setBusy(false);
    }
  }, [applyStep]);

  const submit = useCallback(
    async (body: Record<string, unknown>) => {
      if (!token || busy) return;
      setBusy(true);
      const finishing = section && section.plan.index === (section.plan.kind === "experimental" ? section.plan.index : -1);
      void finishing;
      try {
        const r = await call({ ...body, token });
        if (r.report) setPhase("finishing");
        applyStep(r);
      } catch (e) {
        showPrepToast(e instanceof Error ? e.message : "הפעולה נכשלה", { tone: "error" });
      } finally {
        setBusy(false);
      }
    },
    [applyStep, busy, section, token],
  );

  // Section clock: counts down from the server's figure; at zero the section is closed as is.
  useEffect(() => {
    if (phase !== "running" || !section) return;
    const id = window.setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [phase, section]);

  useEffect(() => {
    if (phase !== "running" || !section || secondsLeft > 0 || busy) return;
    if (timedOutFor.current === sectionKey) return;
    timedOutFor.current = sectionKey;
    void submit({ action: "timeout", answers });
  }, [answers, busy, phase, secondsLeft, section, sectionKey, submit]);

  const singleQuestion = section?.plan.mode === "single" ? section.questions[0] ?? null : null;

  // Tells the course assistant which question is on screen. Timed: the key stays
  // hidden until the learner has chosen. In a set, the question last touched counts.
  const tellAssistant = useCallback(
    (q: ClientQuestion, selected: string | null | undefined) => {
      if (!section) return;
      const passage = q.passageId ? section.passages.find((p) => p.id === q.passageId) : undefined;
      dispatchAmirantQuestionContext({
        kind: "quiz_question",
        questionText: amirantExamQuestionPromptForDisplay(q.stem),
        questionId: q.questionId,
        topic: POOL_TYPE_TO_BANK_TOPIC[section.plan.type],
        questionType: POOL_TYPE_TO_BANK_TOPIC[section.plan.type] ?? section.plan.type,
        options: q.options.map((o) => ({ id: o.id, label: o.label })),
        passageText: passage?.bodyMarkdown.slice(0, 4000),
        timed: true,
        answered: selected != null,
        selectedOptionId: selected ?? null,
      });
    },
    [section],
  );
  const singleSelected = singleQuestion ? answers[singleQuestion.questionId] ?? null : null;
  useEffect(() => {
    if (phase !== "running" || !singleQuestion) return;
    tellAssistant(singleQuestion, singleSelected);
  }, [phase, singleQuestion, singleSelected, tellAssistant]);
  const singleWord = section?.plan.mode === "single" ? section.wordFormation[0] ?? null : null;
  const essayWords = useMemo(() => countWords(essay), [essay]);

  if (phase === "intro") {
    return (
      <div className="space-y-10" dir="rtl">
        <div className="max-w-2xl">
          <h1 className="text-[1.9rem] font-extrabold leading-tight text-ink md:text-[2.3rem]">סימולציה אדפטיבית</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            מבחן מלא כמו במאל״ו: שישה פרקי ציון (השלמת משפטים, הבנת הנקרא, ניסוח מחדש) ב-39 דקות, ואחריהם פרק ניסיוני: האזנה ויצירת
            מילה, או מטלת כתיבה. השאלות נבחרות תוך כדי לפי התשובות שלכם, כמו במבחן האמיתי. אפשר לחזור לשאלות בתוך פרק, לא לפרק שהסתיים.
            שאלה בלי תשובה נחשבת שגויה.
          </p>
          <p className="mt-2 text-sm text-muted">בסוף: ציון משוער בסולם 50–150 (כטווח), הרמה, ומסלול הרמות בכל פרק. אף שאלה לא חוזרת בין סימולציות.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={start} disabled={busy} className={btnPrimary}>
              {busy ? "מכינים…" : "התחלת סימולציה"}
            </button>
            <Link href={COURSE_BASE} className={btnSecondary}>
              לתוכנית הקורס
            </Link>
          </div>
          {!persistent ? <p className="mt-3 text-xs text-muted">במצב פיתוח התוצאות נשמרות רק לזמן ריצת השרת.</p> : null}
        </div>
        {history.length ? (
          <section className="max-w-2xl">
            <h2 className="text-lg font-bold text-ink">סימולציות קודמות</h2>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="text-xs font-bold text-muted">
                  <th className="py-2 text-start">תאריך</th>
                  <th className="py-2 text-start">ציון משוער</th>
                  <th className="py-2 text-start">רמה</th>
                </tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={`${a.attemptId}-${a.finishedAt}`} className="border-t border-line/70">
                    <td className="py-2.5 tabular-nums text-muted">{new Date(a.finishedAt).toLocaleDateString("he-IL")}</td>
                    <td className="py-2.5 font-semibold tabular-nums text-ink">
                      {a.low}–{a.high}
                    </td>
                    <td className="py-2.5 text-ink">{a.bandHe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    );
  }

  if (phase === "finishing") {
    return (
      <p className="py-10 text-center text-base text-muted" dir="rtl" role="status">
        מחשבים את התוצאה…
      </p>
    );
  }

  if (phase === "summary" && report) {
    return (
      <div className="space-y-8" dir="rtl">
        <div>
          <p className="text-sm font-semibold text-muted">ציון משוער</p>
          <p className="mt-1 text-[3rem] font-black leading-none tabular-nums text-primary">
            {report.low}–{report.high}
          </p>
          <p className="mt-2 text-lg font-bold text-ink">{report.bandHe}</p>
          <p className="mt-1 text-sm text-muted">
            {report.scoredCorrect} מתוך {report.scoredTotal} נכונות בפרקי הציון
            {report.bonus ? ` · בונוס ${report.bonus} מהפרק הניסיוני` : ""}. הציון מוצג כטווח כי הוא מבוסס על מספר קטן של שאלות; זו
            הערכה לתרגול, לא ציון רשמי.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-bold text-ink">מסלול הרמות</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="text-xs font-bold text-muted">
                <th className="py-2 text-start">פרק</th>
                <th className="py-2 text-start">כניסה</th>
                <th className="py-2 text-start">יציאה</th>
                <th className="py-2 text-start">נכונות</th>
                <th className="py-2 text-start">זמן</th>
              </tr>
            </thead>
            <tbody>
              {report.sections.map((s) => (
                <tr key={s.index} className="border-t border-line/70">
                  <td className="py-2.5 text-ink">{s.labelHe}</td>
                  <td className="py-2.5 tabular-nums text-muted">{s.enterLevel}</td>
                  <td className="py-2.5 tabular-nums text-muted">{s.exitLevel}</td>
                  <td className="py-2.5 tabular-nums text-ink">
                    {s.correct}/{s.total}
                  </td>
                  <td className="py-2.5 tabular-nums text-muted">{formatClock(s.elapsedSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.substitutions ? (
            <p className="mt-2 text-xs text-muted">ב-{report.substitutions} מקרים לא נותרו שאלות ברמה המדויקת ונבחרה הרמה הקרובה.</p>
          ) : null}
        </section>

        {report.bandsCrossed.length ? (
          <section className="max-w-2xl space-y-6">
            {report.bandsCrossed.length > 1 ? (
              <p className="text-sm text-muted">הטווח חוצה גבול בין שתי רמות, לכן מוצג המשוב של שתיהן.</p>
            ) : null}
            {report.bandsCrossed.map((b) => (
              <div key={b.min}>
                <h2 className="text-lg font-bold text-ink">
                  {b.min}–{b.max} · {b.labelHe}
                </h2>
                <p className="mt-1 text-[15px] leading-relaxed text-ink">{b.summaryHe}</p>
                <p className="text-sm italic text-muted" dir="ltr" lang="en" style={{ textAlign: "left" }}>
                  {b.summaryEn}
                </p>
                {(
                  [
                    ["מה לשמר", b.keepHe],
                    ["מה לשפר", b.improveHe],
                    ["הצעד הבא", b.nextHe],
                  ] as const
                ).map(([title, items]) => (
                  <div key={title} className="mt-3">
                    <p className="text-sm font-bold text-ink">{title}</p>
                    <ul className="mt-1 list-disc space-y-1 ps-5 text-[15px] leading-relaxed text-ink">
                      {items.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </section>
        ) : null}

        {report.sectionNotes.length ? (
          <section className="max-w-2xl">
            <h2 className="text-lg font-bold text-ink">הערות לפי פרק</h2>
            <ul className="mt-3 space-y-4">
              {report.sectionNotes.map((n) => (
                <li key={n.type}>
                  <p className="text-sm font-bold text-ink">
                    {n.labelHe} · {Math.round(n.accuracy * 100)}% נכונות
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink">{n.noteHe}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{n.methodHe}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {report.writing ? (
          <section className="max-w-2xl">
            <h2 className="text-lg font-bold text-ink">מטלת הכתיבה</h2>
            <p className="mt-2 text-sm text-ink">
              תוכן וארגון: <b>{LEVEL_HE[report.writing.content]}</b> · שפה: <b>{LEVEL_HE[report.writing.language]}</b> · {report.writing.wordCount} מילים
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{report.writing.whyContentHe}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{report.writing.whyLanguageHe}</p>
            {report.writing.fixHe.length ? (
              <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-ink">
                {report.writing.fixHe.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {report.bandTable.length ? (
          <section className="max-w-2xl">
            <h2 className="text-lg font-bold text-ink">מה כל ציון אומר</h2>
            <table className="mt-3 w-full border-collapse text-sm">
              <tbody>
                {report.bandTable.map((b) => (
                  <tr key={b.min} className={cn("border-t border-line/70 align-top", report.bandsCrossed.some((c) => c.min === b.min) && "font-semibold")}>
                    <td className="w-20 py-2.5 tabular-nums text-ink">
                      {b.min}–{b.max}
                    </td>
                    <td className="w-28 py-2.5 text-ink">{b.labelHe}</td>
                    <td className="py-2.5 leading-relaxed text-muted">{b.meaningHe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {report.disclaimersHe.length ? (
          <ul className="max-w-2xl list-disc space-y-1 ps-5 text-sm leading-relaxed text-muted">
            {report.disclaimersHe.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setPhase("intro")} className={btnPrimary}>
            סימולציה נוספת
          </button>
          <Link href={`${COURSE_BASE}/analytics`} className={btnSecondary}>
            אנליטיקה
          </Link>
          <Link href={COURSE_BASE} className={btnSecondary}>
            לקורס
          </Link>
        </div>
      </div>
    );
  }

  if (!section) return null;
  const plan = section.plan;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <p className="text-sm font-bold text-primary">
          {plan.labelHe}
          {plan.mode === "single" ? ` · שאלה ${section.position} מתוך ${plan.questionCount}` : ""}
        </p>
        <span role="timer" aria-label="זמן שנותר" className={cn("font-mono text-lg font-bold tabular-nums", secondsLeft <= 30 ? "text-red-600" : "text-ink")}>
          {formatClock(secondsLeft)}
        </span>
        <QuizTimeAnnouncer secondsLeft={secondsLeft} />
      </div>

      {singleQuestion ? (
        <div className="space-y-5">
          <p className="text-base font-medium leading-relaxed text-ink" dir="ltr" lang="en" style={{ textAlign: "left" }}>
            {amirantExamQuestionPromptForDisplay(singleQuestion.stem)}
          </p>
          <QuizOptionGroup className="space-y-2">
            {singleQuestion.options.map((opt, i) => (
              <div key={opt.id}>
                <QuizOptionButton
                  checked={answers[singleQuestion.questionId] === opt.id}
                  index={i}
                  anyChecked={answers[singleQuestion.questionId] != null}
                  onClick={() => setAnswers({ [singleQuestion.questionId]: opt.id })}
                  className={cn(
                    "min-h-11 w-full rounded border px-4 py-3 text-start text-sm transition",
                    answers[singleQuestion.questionId] === opt.id ? "border-primary bg-primary/10 font-semibold text-primary" : "border-line/80 bg-paper hover:border-primary/40",
                  )}
                >
                  <QuizOptionContent index={i} label={opt.label} state={answers[singleQuestion.questionId] === opt.id ? "selected" : "idle"} />
                </QuizOptionButton>
              </div>
            ))}
          </QuizOptionGroup>
          <button
            type="button"
            disabled={busy || !answers[singleQuestion.questionId]}
            onClick={() => void submit({ action: "answer", questionId: singleQuestion.questionId, answer: answers[singleQuestion.questionId] })}
            className={btnPrimary}
          >
            {section.position >= plan.questionCount ? "סיום פרק" : "אישור והמשך"}
          </button>
        </div>
      ) : null}

      {singleWord ? (
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-ink" dir="ltr" lang="en" style={{ textAlign: "left" }}>
            {singleWord.sentence}
          </p>
          <p className="text-sm text-muted">
            מילת הבסיס: <b dir="ltr">{singleWord.baseWord}</b>. כתבו את הצורה שמתאימה לחסר.
          </p>
          <input
            type="text"
            dir="ltr"
            lang="en"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typed.trim() && !busy) void submit({ action: "answer", questionId: singleWord.questionId, answer: typed.trim() });
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="התשובה"
            className="min-h-11 w-full max-w-xs rounded border border-line bg-paper px-3 text-base text-ink focus:border-primary focus:outline-none"
          />
          <button type="button" disabled={busy || !typed.trim()} onClick={() => void submit({ action: "answer", questionId: singleWord.questionId, answer: typed.trim() })} className={btnPrimary}>
            {section.position >= plan.questionCount ? "סיום פרק" : "אישור והמשך"}
          </button>
        </div>
      ) : null}

      {plan.mode === "set" ? (
        <div className="space-y-8">
          {section.passages.map((p) => {
            const qs = section.questions.filter((q) => q.passageId === p.id);
            return (
              <div key={p.id} className="space-y-4">
                <QuizPassagePanel passage={{ id: p.id, title: p.title, bodyMarkdown: p.bodyMarkdown }} className="max-h-none" />
                {qs.map((q, qi) => (
                  <div
                    key={q.questionId}
                    className="space-y-2"
                    onFocusCapture={() => tellAssistant(q, answers[q.questionId])}
                    onPointerDownCapture={() => tellAssistant(q, answers[q.questionId])}
                  >
                    <p className="text-base font-medium leading-relaxed text-ink" dir="ltr" lang="en" style={{ textAlign: "left" }}>
                      <span className="me-2 text-sm text-muted">{section.questions.indexOf(q) + 1}.</span>
                      {amirantExamQuestionPromptForDisplay(q.stem)}
                    </p>
                    <QuizOptionGroup className="space-y-2">
                      {q.options.map((opt, i) => (
                        <div key={opt.id}>
                          <QuizOptionButton
                            checked={answers[q.questionId] === opt.id}
                            index={i}
                            anyChecked={answers[q.questionId] != null}
                            onClick={() => {
                              setAnswers((a) => ({ ...a, [q.questionId]: opt.id }));
                              tellAssistant(q, opt.id);
                            }}
                            className={cn(
                              "min-h-11 w-full rounded border px-4 py-3 text-start text-sm transition",
                              answers[q.questionId] === opt.id ? "border-primary bg-primary/10 font-semibold text-primary" : "border-line/80 bg-paper hover:border-primary/40",
                            )}
                          >
                            <QuizOptionContent index={i} label={opt.label} state={answers[q.questionId] === opt.id ? "selected" : "idle"} />
                          </QuizOptionButton>
                        </div>
                      ))}
                    </QuizOptionGroup>
                    {qi === qs.length - 1 ? null : null}
                  </div>
                ))}
              </div>
            );
          })}
          <button type="button" disabled={busy} onClick={() => void submit({ action: "submitSet", answers })} className={btnPrimary}>
            סיום פרק ({Object.values(answers).filter(Boolean).length}/{section.questions.length} נענו)
          </button>
        </div>
      ) : null}

      {plan.mode === "writing" && section.writing ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">Write a response to the topic below. {section.writing.wordRange[0]}–{section.writing.wordRange[1]} words.</p>
          <p className="text-base font-medium leading-relaxed text-ink" dir="ltr" lang="en" style={{ textAlign: "left" }}>
            {section.writing.prompt}
          </p>
          <textarea
            dir="ltr"
            lang="en"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            rows={10}
            placeholder="Type your response here."
            className="w-full rounded border border-line bg-paper p-3 text-base leading-relaxed text-ink focus:border-primary focus:outline-none"
          />
          <p className={cn("text-sm tabular-nums", essayWords < section.writing.wordRange[0] || essayWords > section.writing.wordRange[1] ? "text-amber-700" : "text-muted")}>
            {essayWords} מילים
          </p>
          <button type="button" disabled={busy} onClick={() => void submit({ action: "submitWriting", text: essay })} className={btnPrimary}>
            שליחה וסיום הסימולציה
          </button>
        </div>
      ) : null}
    </div>
  );
}
