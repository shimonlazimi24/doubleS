"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { PREP_BASE } from "@/lib/prep/constants";
import { formatDateHe } from "@/lib/prep/format-date-he";
import {
  DAILY_STUDY_LABELS,
  DAILY_STUDY_OPTIONS,
  FIRST_TIME_LABELS,
  FIRST_TIME_OPTIONS,
  examDateError,
  isoDay,
  type OnboardingPayload,
} from "@/lib/prep/onboarding/schema";
import { ONBOARDING_LOCAL_KEY } from "@/lib/prep/onboarding/weekly-goal";

const TOTAL_STEPS = 3;

type FirstTime = (typeof FIRST_TIME_OPTIONS)[number];
type DailyStudy = (typeof DAILY_STUDY_OPTIONS)[number];

export type OnboardingInitial = {
  sortingExamDate: string;
  sortingExamDateUnknown: boolean;
  firstTimeExam: FirstTime | "";
  firstTimeExamOther: string;
  dailyStudyTime: DailyStudy | "";
};

const EMPTY: OnboardingInitial = {
  sortingExamDate: "",
  sortingExamDateUnknown: false,
  firstTimeExam: "",
  firstTimeExamOther: "",
  dailyStudyTime: "",
};

/* ── Browser storage (best effort) ────────────────────────────────
 * The draft survives a refresh mid-questionnaire. The finished answers are
 * stored locally only when the server has no database (local dev / demo);
 * otherwise a shared computer would show one learner's plan to the next. */

function readDraft(): Partial<OnboardingInitial> | null {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_LOCAL_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { draft?: Partial<OnboardingInitial> }).draft ?? null;
  } catch {
    return null;
  }
}

function writeLocal(patch: { draft?: OnboardingInitial | null; completed?: OnboardingPayload | null }) {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_LOCAL_KEY);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const next: Record<string, unknown> = { ...prev, updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete next[k];
      else if (v !== undefined) next[k] = v;
    }
    window.localStorage.setItem(ONBOARDING_LOCAL_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the form still works, the draft just does not survive a refresh */
  }
}

/* ── Pieces ───────────────────────────────────────────────────── */

function Progress({ step }: { step: number }) {
  return (
    <div>
      <p className="text-sm tabular-nums text-muted">
        שלב {step} מתוך {TOTAL_STEPS}
      </p>
      <div
        className="mt-2 h-0.5 w-full bg-line"
        role="progressbar"
        aria-label="התקדמות בשאלון"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
      >
        <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
    </div>
  );
}

/** One radio answer as a full-width row. Native input: arrow keys and screen readers work as-is. */
function OptionRow({
  name,
  value,
  label,
  checked,
  onSelect,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 px-4 text-[0.9375rem] transition",
        checked ? "bg-primary-muted font-semibold text-primary" : "text-ink hover:bg-surface-low",
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 shrink-0 accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50"
      />
      {label}
    </label>
  );
}

/** Same scale as `<Heading level={3}>`; a plain h1 because the heading needs a ref for focus. */
const TITLE = "font-display text-xl font-semibold leading-snug text-ink outline-none md:text-2xl";

const FIELD =
  "min-h-12 w-full rounded-control border border-line bg-paper px-4 text-[0.9375rem] text-ink outline-none transition placeholder:text-muted-2 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-low disabled:text-muted-2";

/* ── Wizard ───────────────────────────────────────────────────── */

export function PrepOnboardingWizard({
  nextPath,
  initial,
  editing = false,
}: {
  nextPath: string;
  /** Saved answers, when an existing learner opens the form to change them. */
  initial?: OnboardingInitial;
  editing?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [state, setState] = useState<OnboardingInitial>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedRef = useRef(false);

  // Restore an unfinished draft once, unless we were handed saved answers.
  useEffect(() => {
    if (initial) return;
    const draft = readDraft();
    if (draft) setState((s) => ({ ...s, ...draft }));
  }, [initial]);

  // Move focus to the new question so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (!movedRef.current) return;
    // preventScroll: the site header is sticky, and a scrolled-to heading lands under it.
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step, done]);

  const today = useMemo(() => isoDay(new Date()), []);

  const patch = useCallback(
    (partial: Partial<OnboardingInitial>) => {
      setState((s) => {
        const next = { ...s, ...partial };
        if (!editing) writeLocal({ draft: next });
        return next;
      });
      setError(null);
    },
    [editing],
  );

  /** Why the current step cannot advance, or null. Shown only after a Next attempt. */
  const stepProblem = useMemo((): string | null => {
    if (step === 1) {
      if (state.sortingExamDateUnknown) return null;
      if (!state.sortingExamDate) return "בחרו תאריך, או סמנו «עוד לא נקבע».";
      return examDateError(state.sortingExamDate);
    }
    if (step === 2) {
      if (!state.firstTimeExam) return "בחרו תשובה אחת.";
      if (state.firstTimeExam === "other" && !state.firstTimeExamOther.trim()) {
        return "כתבו במילה או שתיים מה המצב.";
      }
      return null;
    }
    if (step === 3) return state.dailyStudyTime ? null : "בחרו תשובה אחת.";
    return null;
  }, [step, state]);

  const buildPayload = useCallback(
    (): OnboardingPayload => ({
      sortingExamDate: state.sortingExamDateUnknown ? null : state.sortingExamDate || null,
      sortingExamDateUnknown: state.sortingExamDateUnknown,
      institutionName: "לא צוין",
      fieldOfStudy: "לא צוין",
      firstTimeExam: state.firstTimeExam as FirstTime,
      firstTimeExamOther: state.firstTimeExam === "other" ? state.firstTimeExamOther.trim() : null,
      dailyStudyTime: state.dailyStudyTime as DailyStudy,
      dailyStudyTimeOther: null,
      heardAbout: [],
      heardAboutOther: null,
    }),
    [state],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    setSignedOut(false);
    const payload = buildPayload();
    try {
      const res = await fetch("/api/prep/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        configured?: boolean;
      };
      if (res.ok) {
        writeLocal({ draft: null, completed: data.configured === false ? payload : null });
        movedRef.current = true;
        setDone(true);
        router.refresh();
        return;
      }
      if (res.status === 401) setSignedOut(true);
      setError(data.error ?? "השמירה נכשלה. נסו שוב.");
    } catch {
      setError("אין חיבור לרשת. התשובות לא נשמרו; נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, router]);

  function onNext(e?: React.FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    if (stepProblem) {
      setError(stepProblem);
      return;
    }
    if (step === TOTAL_STEPS) {
      void submit();
      return;
    }
    movedRef.current = true;
    setError(null);
    setStep((s) => s + 1);
  }

  function onBack() {
    movedRef.current = true;
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  const summary = useMemo(() => {
    const parts = [
      state.sortingExamDateUnknown || !state.sortingExamDate
        ? "תאריך המבחן עוד לא נקבע"
        : `מבחן ב-${formatDateHe(state.sortingExamDate)}`,
    ];
    if (state.firstTimeExam === "other") parts.push(state.firstTimeExamOther.trim());
    else if (state.firstTimeExam) parts.push(FIRST_TIME_LABELS[state.firstTimeExam]);
    if (state.dailyStudyTime && state.dailyStudyTime !== "unknown") {
      parts.push(`${DAILY_STUDY_LABELS[state.dailyStudyTime]} ביום`);
    }
    return parts.filter(Boolean).join(" · ");
  }, [state]);

  /* ── Finished ── */
  if (done) {
    const goesToPricing = nextPath.includes("/pricing");
    const courseHome = `${PREP_BASE}/amirant/course`;
    return (
      <div dir="rtl" className="w-full max-w-md">
        <h1 ref={headingRef} tabIndex={-1} className={TITLE}>
          {editing ? "התשובות עודכנו" : goesToPricing ? "נשאר לבחור תוכנית" : "סיימנו. אפשר להתחיל."}
        </h1>
        <Text variant="bodySm" className="mt-3">
          {summary}
        </Text>
        {goesToPricing ? (
          <Text variant="bodySm" className="mt-2">
            מודול המבוא ומבחן הרמה פתוחים בלי תשלום. הקורס המלא פתוח עם כל אחת מהתוכניות.
          </Text>
        ) : editing ? null : (
          <Text variant="bodySm" className="mt-2">
            כדאי להתחיל במבחן הרמה במודול המבוא. לפיו הקורס מסמן מאיפה להתחיל.
          </Text>
        )}
        <div className="mt-8 flex flex-col gap-2">
          <Button variant="primary" className="min-h-12 w-full text-[0.9375rem]" onClick={() => router.push(nextPath)}>
            {goesToPricing ? "לתוכניות ולמחירים" : editing ? "חזרה" : "לקורס"}
          </Button>
          {nextPath !== courseHome ? (
            <Link
              href={courseHome}
              className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-muted transition hover:text-primary"
            >
              {goesToPricing ? "קודם למודול המבוא" : "לעמוד הקורס"}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  /* ── Steps ── */
  const titles: Record<number, { title: string; hint: string }> = {
    1: { title: "מתי המבחן שלכם?", hint: "לפי התאריך נציע כמה ללמוד בכל שבוע." },
    2: { title: "זו הפעם הראשונה שאתם ניגשים לאמירנט?", hint: "כדי שנדע מאיפה אתם מתחילים." },
    3: { title: "כמה זמן ביום תוכלו ללמוד?", hint: "הערכה מספיקה. אפשר לשנות אחר כך." },
  };
  const { title, hint } = titles[step]!;
  const errorId = "onboarding-error";

  return (
    <form dir="rtl" className="w-full max-w-md" onSubmit={onNext} noValidate>
      <Progress step={step} />

      <fieldset className="mt-8" aria-describedby={error ? errorId : undefined}>
        <legend className="contents">
          <h1 ref={headingRef} tabIndex={-1} className={TITLE}>
            {title}
          </h1>
        </legend>
        <Text variant="bodySm" className="mt-2">
          {hint}
        </Text>

        <div className="mt-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="onb-exam-date" className="mb-1.5 block text-sm font-medium text-ink">
                  תאריך המבחן
                </label>
                <input
                  id="onb-exam-date"
                  type="date"
                  min={today}
                  value={state.sortingExamDateUnknown ? "" : state.sortingExamDate}
                  disabled={state.sortingExamDateUnknown}
                  onChange={(e) => patch({ sortingExamDate: e.target.value })}
                  aria-invalid={Boolean(error)}
                  className={cn(FIELD, "text-right")}
                />
              </div>
              <label
                htmlFor="onb-exam-unknown"
                className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-ink"
              >
                <input
                  id="onb-exam-unknown"
                  type="checkbox"
                  checked={state.sortingExamDateUnknown}
                  onChange={(e) => patch({ sortingExamDateUnknown: e.target.checked })}
                  className="h-4 w-4 accent-primary"
                />
                עוד לא נקבע
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="divide-y divide-line overflow-hidden rounded-control border border-line bg-paper">
                {FIRST_TIME_OPTIONS.map((opt) => (
                  <OptionRow
                    key={opt}
                    name="first-time"
                    value={opt}
                    label={FIRST_TIME_LABELS[opt]}
                    checked={state.firstTimeExam === opt}
                    onSelect={() => patch({ firstTimeExam: opt })}
                  />
                ))}
              </div>
              {state.firstTimeExam === "other" ? (
                <div>
                  <label htmlFor="onb-first-other" className="mb-1.5 block text-sm font-medium text-ink">
                    מה המצב?
                  </label>
                  <input
                    id="onb-first-other"
                    value={state.firstTimeExamOther}
                    onChange={(e) => patch({ firstTimeExamOther: e.target.value })}
                    maxLength={200}
                    placeholder="למשל: נבחנתי בפסיכומטרי, לא באמירנט"
                    className={FIELD}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="divide-y divide-line overflow-hidden rounded-control border border-line bg-paper">
              {DAILY_STUDY_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt}
                  name="daily-study"
                  value={opt}
                  label={DAILY_STUDY_LABELS[opt]}
                  checked={state.dailyStudyTime === opt}
                  onSelect={() => patch({ dailyStudyTime: opt })}
                />
              ))}
            </div>
          ) : null}
        </div>
      </fieldset>

      <div className="min-h-[3.25rem] pt-3" aria-live="assertive">
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-red-700">
            {error}
            {signedOut ? (
              <>
                {" "}
                <Link
                  href={`${PREP_BASE}/login?next=${encodeURIComponent(`${PREP_BASE}/onboarding?next=${encodeURIComponent(nextPath)}`)}`}
                  className="font-semibold underline underline-offset-2"
                >
                  להתחברות
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* Back on the right, Next on the left: the reading direction of an RTL form. */}
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-5">
        {step > 1 ? (
          <Button variant="ghost" className="min-h-11 px-4" onClick={onBack} disabled={submitting}>
            הקודם
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          variant="primary"
          className="min-h-12 min-w-[8rem] px-8 text-[0.9375rem]"
          disabled={submitting}
          aria-busy={submitting}
        >
          {step === TOTAL_STEPS ? (submitting ? "שומר…" : editing ? "שמירה" : "סיום") : "המשך"}
        </Button>
      </div>
    </form>
  );
}
