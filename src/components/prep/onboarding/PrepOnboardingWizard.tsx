"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/design-system/cn";
import { PREP_BASE } from "@/lib/prep/constants";
import { formatDateHe } from "@/lib/prep/format-date-he";
import {
  DAILY_STUDY_LABELS,
  DAILY_STUDY_OPTIONS,
  FIRST_TIME_LABELS,
  FIRST_TIME_OPTIONS,
  HEARD_ABOUT_LABELS,
  HEARD_ABOUT_OPTIONS,
  type OnboardingPayload,
} from "@/lib/prep/onboarding/schema";
import institutions from "../../../../content/onboarding/israeli-institutions.json";
import fieldsOfStudy from "../../../../content/onboarding/fields-of-study.json";

const TOTAL_STEPS = 6;
const FINISH_STEP = TOTAL_STEPS + 1;
const INSTITUTIONS = institutions as string[];
const FIELDS = fieldsOfStudy as string[];
const DASHBOARD_PATH = `${PREP_BASE}/amirant/course/dashboard`;
/** נשמר מקומית כשאין Supabase (פיתוח/דמו) וכטיוטה בין שלבים - best effort. */
const LOCAL_KEY = "prep_onboarding_v1";

type FirstTime = (typeof FIRST_TIME_OPTIONS)[number];
type DailyStudy = (typeof DAILY_STUDY_OPTIONS)[number];
type HeardAbout = (typeof HEARD_ABOUT_OPTIONS)[number];

type WizardState = {
  sortingExamDate: string;
  sortingExamDateUnknown: boolean;
  institutionName: string;
  fieldOfStudy: string;
  firstTimeExam: FirstTime | "";
  firstTimeExamOther: string;
  dailyStudyTime: DailyStudy | "";
  heardAbout: HeardAbout | "";
  heardAboutOther: string;
};

const initialState: WizardState = {
  sortingExamDate: "",
  sortingExamDateUnknown: false,
  institutionName: "",
  fieldOfStudy: "",
  firstTimeExam: "",
  firstTimeExamOther: "",
  dailyStudyTime: "",
  heardAbout: "",
  heardAboutOther: "",
};

/* ── Local draft (best-effort) ────────────────────────────────── */

function readLocalDraft(): Partial<WizardState> | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { draft?: Partial<WizardState> };
    return parsed.draft ?? null;
  } catch {
    return null;
  }
}

function writeLocal(data: { draft?: WizardState; completed?: OnboardingPayload; synced?: boolean }) {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({ ...prev, ...data, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* best effort */
  }
}

function clearLocalDraft() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    const prev = JSON.parse(raw) as Record<string, unknown>;
    delete prev.draft;
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(prev));
  } catch {
    /* best effort */
  }
}

/* ── Sub-components ───────────────────────────────────────────── */

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block rounded-full transition-all duration-220",
            i + 1 < current ? "h-1.5 w-1.5 bg-primary/60" : i + 1 === current ? "h-1.5 w-5 bg-primary" : "h-1.5 w-1.5 bg-line",
          )}
        />
      ))}
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink md:text-[1.75rem]">
        {title}
      </h1>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

/** צ'יפ בחירה-יחידה גדול ונוח ללחיצה. */
function ChoiceChip({
  label,
  selected,
  onClick,
  wide,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-control border px-5 text-[0.9375rem] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50",
        wide && "w-full",
        selected
          ? "border-primary bg-primary text-white"
          : "border-line bg-paper text-ink hover:border-primary/40 hover:bg-surface-low",
      )}
    >
      {label}
    </button>
  );
}

function OtherInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      aria-label={label}
      dir="rtl"
      autoFocus
      className="w-full rounded-control border border-line bg-paper px-4 py-3 text-right text-[0.9375rem] text-ink outline-none transition placeholder:text-muted-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

/** קומבו-בוקס: טקסט חופשי + הצעות מסוננות תוך כדי הקלדה. */
function ComboboxInput({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = value.trim();
    if (!q) return options.slice(0, 8);
    return options.filter((o) => o.includes(q)).slice(0, 8);
  }, [value, options]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") setOpen(false);
          }}
          placeholder={placeholder}
          dir="rtl"
          autoComplete="off"
          className="w-full rounded-control border border-line bg-paper px-4 py-3.5 text-right text-[0.9375rem] text-ink outline-none transition placeholder:text-muted-2 focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        {open && filtered.length > 0 ? (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-md border border-line bg-paper py-1 shadow-card"
          >
            {filtered.map((opt) => (
              <li key={opt} role="option" aria-selected={opt === value}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-right text-sm transition hover:bg-surface-low",
                    opt === value ? "font-semibold text-primary" : "text-ink",
                  )}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="text-xs text-muted-2">אפשר לבחור מהרשימה או לכתוב תשובה חופשית.</p>
    </div>
  );
}

/* ── Main Wizard ──────────────────────────────────────────────── */

export function PrepOnboardingWizard({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* שחזור טיוטה מקומית (best effort) - פעם אחת אחרי mount. */
  useEffect(() => {
    const draft = readLocalDraft();
    if (draft) setState((s) => ({ ...s, ...draft }));
  }, []);

  const patch = useCallback((partial: Partial<WizardState>) => {
    setState((s) => ({ ...s, ...partial }));
    setError(null);
  }, []);

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return state.sortingExamDateUnknown || state.sortingExamDate.length > 0;
      case 2:
        return state.institutionName.trim().length > 0;
      case 3:
        return state.fieldOfStudy.trim().length > 0;
      case 4:
        if (!state.firstTimeExam) return false;
        if (state.firstTimeExam === "other") return state.firstTimeExamOther.trim().length > 0;
        return true;
      case 5:
        return state.dailyStudyTime !== "";
      case 6:
        if (!state.heardAbout) return false;
        if (state.heardAbout === "other") return state.heardAboutOther.trim().length > 0;
        return true;
      default:
        return true;
    }
  }, [step, state]);

  const buildPayload = useCallback(
    (): OnboardingPayload => ({
      sortingExamDate: state.sortingExamDateUnknown ? null : state.sortingExamDate || null,
      sortingExamDateUnknown: state.sortingExamDateUnknown,
      institutionName: state.institutionName.trim(),
      fieldOfStudy: state.fieldOfStudy.trim(),
      firstTimeExam: state.firstTimeExam as FirstTime,
      firstTimeExamOther: state.firstTimeExam === "other" ? state.firstTimeExamOther.trim() : null,
      dailyStudyTime: state.dailyStudyTime as DailyStudy,
      dailyStudyTimeOther: null,
      heardAbout: state.heardAbout ? [state.heardAbout] : [],
      heardAboutOther: state.heardAbout === "other" ? state.heardAboutOther.trim() : null,
    }),
    [state],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    const payload = buildPayload();
    try {
      const res = await fetch("/api/prep/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        clearLocalDraft();
        writeLocal({ completed: payload, synced: true });
        setStep(FINISH_STEP);
      } else if (res.status === 401 || data.error === "Supabase not configured") {
        // אין חשבון מחובר / סביבה בלי Supabase - שמירה מקומית והמשך.
        writeLocal({ completed: payload, synced: false });
        setStep(FINISH_STEP);
      } else {
        setError(data.error ?? "שגיאה בשמירה. נסו שוב.");
      }
    } catch {
      setError("שגיאת רשת. נסו שוב.");
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload]);

  const onNext = useCallback(() => {
    if (!canNext || submitting) return;
    if (step === TOTAL_STEPS) {
      void submit();
      return;
    }
    setState((s) => {
      writeLocal({ draft: s });
      return s;
    });
    setStep((s) => s + 1);
  }, [canNext, submitting, step, submit]);

  const onBack = useCallback(() => {
    setError(null);
    setStep((s) => (s > 1 && s <= TOTAL_STEPS ? s - 1 : s));
  }, []);

  /* Enter מקדם לשלב הבא (מכל מקום במסך, חוץ מכפתורים/קישורים). */
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.isComposing) return;
      const target = e.target as HTMLElement | null;
      if (target && ["BUTTON", "A", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      e.preventDefault();
      onNextRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const summaryLine = useMemo(() => {
    const parts: string[] = [];
    parts.push(
      state.sortingExamDateUnknown || !state.sortingExamDate
        ? "תאריך המבחן עדיין לא נקבע"
        : `מבחן ב-${formatDateHe(state.sortingExamDate)}`,
    );
    if (state.institutionName.trim()) parts.push(state.institutionName.trim());
    if (state.fieldOfStudy.trim()) parts.push(state.fieldOfStudy.trim());
    if (state.dailyStudyTime) parts.push(`${DAILY_STUDY_LABELS[state.dailyStudyTime]} ביום`);
    return parts.join(" · ");
  }, [state]);

  /* ── Finish screen ── */
  if (step === FINISH_STEP) {
    return (
      <div dir="rtl" className="mx-auto w-full max-w-md text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-score/40 bg-score/10 text-lg font-bold text-score" aria-hidden="true">
          ✓
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold leading-snug tracking-tight text-ink md:text-3xl">
          הכל מוכן - קדימה לתרגול!
        </h1>
        <p className="mt-3 text-sm leading-body text-muted">{summaryLine}</p>
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => router.push(nextPath)}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-primary px-6 text-[0.9375rem] font-bold text-white shadow-cta transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50"
          >
            קדימה לתרגול ←
          </button>
          <Link
            href={DASHBOARD_PATH}
            className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-medium text-muted transition hover:text-primary"
          >
            ללוח התלמיד שלי
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-md">
      {/* Progress */}
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">היכרות קצרה</p>
        <div className="mt-4">
          <StepDots current={step} total={TOTAL_STEPS} />
        </div>
        <p className="mt-2 text-xs text-muted-2">
          שלב {step} מתוך {TOTAL_STEPS}
        </p>
      </header>

      {/* גוף השאלה - גובה קבוע כדי שכפתורי הניווט לא יזוזו בין שלבים */}
      <div className="mt-8 flex min-h-[21rem] flex-col">
        {/* Step 1 - תאריך המבחן */}
        {step === 1 && (
          <div className="space-y-6">
            <StepHeading title="מתי מבחן האמירנט שלכם?" subtitle="נעזור לתכנן קצב לימוד שמתאים לזמן שנשאר" />
            <div className="space-y-3">
              <input
                id="exam-date"
                type="date"
                aria-label="תאריך המבחן"
                disabled={state.sortingExamDateUnknown}
                value={state.sortingExamDate}
                onChange={(e) => patch({ sortingExamDate: e.target.value, sortingExamDateUnknown: false })}
                dir="ltr"
                className={cn(
                  "min-h-12 w-full rounded-control border px-4 text-left text-[0.9375rem] outline-none transition focus:ring-2 focus:ring-primary/10",
                  state.sortingExamDateUnknown
                    ? "border-line bg-surface-low text-muted-2"
                    : "border-line bg-paper text-ink focus:border-primary",
                )}
              />
              <div className="flex items-center gap-3 text-xs text-muted-2" aria-hidden="true">
                <span className="h-px flex-1 bg-line" />
                או
                <span className="h-px flex-1 bg-line" />
              </div>
              <ChoiceChip
                label="עדיין לא נקבע"
                wide
                selected={state.sortingExamDateUnknown}
                onClick={() =>
                  patch({
                    sortingExamDateUnknown: !state.sortingExamDateUnknown,
                    sortingExamDate: state.sortingExamDateUnknown ? state.sortingExamDate : "",
                  })
                }
              />
            </div>
          </div>
        )}

        {/* Step 2 - מוסד לימודים */}
        {step === 2 && (
          <div className="space-y-6">
            <StepHeading title="באיזה מוסד אתם לומדים?" subtitle="או המוסד שבכוונתכם להתקבל אליו" />
            <ComboboxInput
              id="institution"
              label="מוסד לימודים"
              value={state.institutionName}
              onChange={(v) => patch({ institutionName: v })}
              options={INSTITUTIONS}
              placeholder="הקלידו שם מוסד..."
            />
          </div>
        )}

        {/* Step 3 - תחום לימודים */}
        {step === 3 && (
          <div className="space-y-6">
            <StepHeading title="מה תחום הלימודים שלכם?" />
            <ComboboxInput
              id="field"
              label="תחום לימודים"
              value={state.fieldOfStudy}
              onChange={(v) => patch({ fieldOfStudy: v })}
              options={FIELDS}
              placeholder="למשל: פסיכולוגיה..."
            />
          </div>
        )}

        {/* Step 4 - פעם ראשונה */}
        {step === 4 && (
          <div className="space-y-6">
            <StepHeading title="האם זו הפעם הראשונה שאתם נבחנים?" />
            <div role="radiogroup" aria-label="האם זו הפעם הראשונה שאתם נבחנים?" className="flex flex-col gap-2.5">
              {FIRST_TIME_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt}
                  wide
                  label={FIRST_TIME_LABELS[opt]}
                  selected={state.firstTimeExam === opt}
                  onClick={() => patch({ firstTimeExam: opt })}
                />
              ))}
            </div>
            {state.firstTimeExam === "other" && (
              <OtherInput
                value={state.firstTimeExamOther}
                onChange={(v) => patch({ firstTimeExamOther: v })}
                label="ספרו לנו בקצרה..."
              />
            )}
          </div>
        )}

        {/* Step 5 - זמן לימוד יומי */}
        {step === 5 && (
          <div className="space-y-6">
            <StepHeading title="כמה זמן ביום מתכננים להקדיש ללמידה?" />
            <div role="radiogroup" aria-label="זמן לימוד יומי" className="flex flex-wrap justify-center gap-2.5">
              {DAILY_STUDY_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt}
                  label={DAILY_STUDY_LABELS[opt]}
                  selected={state.dailyStudyTime === opt}
                  onClick={() => patch({ dailyStudyTime: opt })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 6 - איך שמעתם עלינו */}
        {step === 6 && (
          <div className="space-y-6">
            <StepHeading title="איך שמעתם עלינו?" />
            <div role="radiogroup" aria-label="איך שמעתם עלינו?" className="flex flex-wrap justify-center gap-2.5">
              {HEARD_ABOUT_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt}
                  label={HEARD_ABOUT_LABELS[opt]}
                  selected={state.heardAbout === opt}
                  onClick={() => patch({ heardAbout: opt })}
                />
              ))}
            </div>
            {state.heardAbout === "other" && (
              <OtherInput
                value={state.heardAboutOther}
                onChange={(v) => patch({ heardAboutOther: v })}
                label="ספרו לנו איך הגעתם..."
              />
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p role="alert" className="mt-5 rounded-md bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* ניווט - מיקום קבוע: «הקודם» בימין, «המשך» בשמאל */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line/60 pt-5">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1}
          className={cn(
            "inline-flex min-h-11 items-center rounded-control px-4 text-sm font-medium text-muted transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50",
            step === 1 && "invisible",
          )}
        >
          → הקודם
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext || submitting}
          className={cn(
            "inline-flex min-h-12 items-center justify-center rounded-control px-8 text-[0.9375rem] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/50",
            canNext && !submitting
              ? "bg-primary text-white shadow-cta hover:bg-primary-hover"
              : "cursor-not-allowed bg-line text-muted",
          )}
        >
          {step === TOTAL_STEPS ? (submitting ? "שומר..." : "סיום") : "המשך ←"}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-2">אפשר גם ללחוץ Enter כדי להמשיך</p>
    </div>
  );
}
