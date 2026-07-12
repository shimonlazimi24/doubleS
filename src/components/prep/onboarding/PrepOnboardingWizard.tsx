"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/design-system/cn";
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
const INSTITUTIONS = institutions as string[];
const FIELDS = fieldsOfStudy as string[];

type WizardState = {
  sortingExamDate: string;
  sortingExamDateUnknown: boolean;
  institutionName: string;
  fieldOfStudy: string;
  firstTimeExam: (typeof FIRST_TIME_OPTIONS)[number] | "";
  firstTimeExamOther: string;
  dailyStudyTime: (typeof DAILY_STUDY_OPTIONS)[number] | "";
  dailyStudyTimeOther: string;
  heardAbout: (typeof HEARD_ABOUT_OPTIONS)[number][];
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
  dailyStudyTimeOther: "",
  heardAbout: [],
  heardAboutOther: "",
};

/* ── Sub-components ───────────────────────────────────────────── */

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block rounded-full transition-all duration-300",
            i + 1 < current
              ? "h-2 w-2 bg-score"
              : i + 1 === current
                ? "h-2.5 w-5 bg-primary"
                : "h-2 w-2 bg-line",
          )}
        />
      ))}
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 space-y-1.5 text-center">
      <h2 className="font-display text-xl font-bold text-primary md:text-2xl">{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

function RadioCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-4 py-3.5 text-right text-sm font-medium transition-all duration-150",
        selected
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-line bg-white text-primary hover:border-primary/40 hover:bg-surface-low",
      )}
    >
      {label}
    </button>
  );
}

function CheckChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150",
        selected
          ? "border-primary bg-primary text-white"
          : "border-line bg-white text-primary hover:border-primary/40 hover:bg-surface-low",
      )}
    >
      {label}
    </button>
  );
}

function AutocompleteInput({
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
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 10);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 10);
  }, [value, options]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          dir="rtl"
          autoComplete="off"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-right text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1.5 max-h-52 w-full overflow-auto rounded-xl border border-line bg-white shadow-card">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-right text-sm text-primary transition hover:bg-surface-low"
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OtherInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="פרטו..."
      dir="rtl"
      className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-right text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

/* ── Main Wizard ──────────────────────────────────────────────── */

export function PrepOnboardingWizard({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = useCallback((partial: Partial<WizardState>) => {
    setState((s) => ({ ...s, ...partial }));
    setError(null);
  }, []);

  const canNext = useMemo(() => {
    switch (step) {
      case 1: return state.sortingExamDateUnknown || state.sortingExamDate.length > 0;
      case 2: return state.institutionName.trim().length > 0;
      case 3: return state.fieldOfStudy.trim().length > 0;
      case 4:
        if (!state.firstTimeExam) return false;
        if (state.firstTimeExam === "other") return state.firstTimeExamOther.trim().length > 0;
        return true;
      case 5:
        if (!state.dailyStudyTime) return false;
        if (state.dailyStudyTime === "other") return state.dailyStudyTimeOther.trim().length > 0;
        return true;
      case 6:
        if (state.heardAbout.length === 0) return false;
        if (state.heardAbout.includes("other") && !state.heardAboutOther.trim()) return false;
        return true;
      default: return true;
    }
  }, [step, state]);

  const buildPayload = (): OnboardingPayload => ({
    sortingExamDate: state.sortingExamDateUnknown ? null : state.sortingExamDate || null,
    sortingExamDateUnknown: state.sortingExamDateUnknown,
    institutionName: state.institutionName.trim(),
    fieldOfStudy: state.fieldOfStudy.trim(),
    firstTimeExam: state.firstTimeExam as (typeof FIRST_TIME_OPTIONS)[number],
    firstTimeExamOther: state.firstTimeExam === "other" ? state.firstTimeExamOther.trim() : null,
    dailyStudyTime: state.dailyStudyTime as (typeof DAILY_STUDY_OPTIONS)[number],
    dailyStudyTimeOther: state.dailyStudyTime === "other" ? state.dailyStudyTimeOther.trim() : null,
    heardAbout: state.heardAbout,
    heardAboutOther: state.heardAbout.includes("other") ? state.heardAboutOther.trim() : null,
  });

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/prep/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "שגיאה בשמירה");
        setSubmitting(false);
        return;
      }
      setStep(7);
      setSubmitting(false);
    } catch {
      setError("שגיאת רשת. נסו שוב.");
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (!canNext) return;
    if (step === 6) { void submit(); return; }
    setStep((s) => s + 1);
  };

  const onBack = () => {
    if (step > 1 && step < 7) setStep((s) => s - 1);
  };

  const toggleHeard = (key: (typeof HEARD_ABOUT_OPTIONS)[number]) => {
    setState((s) => {
      const has = s.heardAbout.includes(key);
      return { ...s, heardAbout: has ? s.heardAbout.filter((h) => h !== key) : [...s.heardAbout, key] };
    });
    setError(null);
  };

  return (
    <div dir="rtl" className="mx-auto w-full max-w-lg">

      {/* Card */}
      <div className="rounded-2xl border border-line bg-white shadow-card">

        {/* Header - שפה בהירה, בלי גרדיאנט כהה+זהב */}
        <div className="rounded-t-2xl border-b border-line/60 bg-surface-low px-6 py-5">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            שאלון היכרות
          </p>
          {step <= TOTAL_STEPS && (
            <div className="mt-3">
              <StepDots current={step} total={TOTAL_STEPS} />
              <p className="mt-2 text-center text-xs text-muted">
                שלב {step} מתוך {TOTAL_STEPS}
              </p>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-8 md:px-8">

          {/* Step 1 - Exam date */}
          {step === 1 && (
            <div className="space-y-5">
              <StepHeading title="מתי מבחן המיון שלך?" subtitle="נעזור לך לתכנן את הקצב הנכון" />
              <div className="space-y-2">
                <label htmlFor="exam-date" className="text-sm font-semibold text-primary">
                  תאריך
                </label>
                <input
                  id="exam-date"
                  type="date"
                  disabled={state.sortingExamDateUnknown}
                  value={state.sortingExamDate}
                  onChange={(e) =>
                    patch({ sortingExamDate: e.target.value, sortingExamDateUnknown: false })
                  }
                  dir="ltr"
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm outline-none transition focus:ring-2 focus:ring-primary/10",
                    state.sortingExamDateUnknown
                      ? "border-line bg-surface-low text-muted/70"
                      : "border-line bg-white text-primary focus:border-primary",
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  patch({
                    sortingExamDateUnknown: !state.sortingExamDateUnknown,
                    sortingExamDate: !state.sortingExamDateUnknown ? "" : state.sortingExamDate,
                  })
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition",
                  state.sortingExamDateUnknown
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-white text-muted hover:border-primary/30 hover:bg-surface-low",
                )}
              >
                <span className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition",
                  state.sortingExamDateUnknown
                    ? "border-white bg-white text-primary"
                    : "border-line",
                )}>
                  {state.sortingExamDateUnknown ? "✓" : ""}
                </span>
                לא ידוע עדיין
              </button>
            </div>
          )}

          {/* Step 2 - Institution */}
          {step === 2 && (
            <div className="space-y-5">
              <StepHeading title="באיזה מוסד לימודים?" subtitle="כדי להתאים את החומר לדרישות שלך" />
              <AutocompleteInput
                id="institution"
                label="שם המוסד"
                value={state.institutionName}
                onChange={(v) => patch({ institutionName: v })}
                options={INSTITUTIONS}
                placeholder="הקלידו שם מוסד..."
              />
            </div>
          )}

          {/* Step 3 - Field of study */}
          {step === 3 && (
            <div className="space-y-5">
              <StepHeading title="מה תחום הלימודים?" subtitle="נשתמש בזה להמלצות מותאמות" />
              <AutocompleteInput
                id="field"
                label="תחום לימודים"
                value={state.fieldOfStudy}
                onChange={(v) => patch({ fieldOfStudy: v })}
                options={FIELDS}
                placeholder="למשל: הנדסת תוכנה..."
              />
            </div>
          )}

          {/* Step 4 - First time */}
          {step === 4 && (
            <div className="space-y-4">
              <StepHeading title="האם זו הפעם הראשונה?" />
              <div className="flex flex-col gap-2.5">
                {FIRST_TIME_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt}
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
                />
              )}
            </div>
          )}

          {/* Step 5 - Daily study time */}
          {step === 5 && (
            <div className="space-y-4">
              <StepHeading title="כמה זמן ביום ללמידה?" subtitle="נתכנן איתך קצב ריאלי" />
              <div className="flex flex-wrap gap-2.5">
                {DAILY_STUDY_OPTIONS.map((opt) => (
                  <CheckChip
                    key={opt}
                    label={DAILY_STUDY_LABELS[opt]}
                    selected={state.dailyStudyTime === opt}
                    onClick={() => patch({ dailyStudyTime: opt })}
                  />
                ))}
              </div>
              {state.dailyStudyTime === "other" && (
                <OtherInput
                  value={state.dailyStudyTimeOther}
                  onChange={(v) => patch({ dailyStudyTimeOther: v })}
                />
              )}
            </div>
          )}

          {/* Step 6 - Heard about */}
          {step === 6 && (
            <div className="space-y-4">
              <StepHeading title="איך שמעת עלינו?" subtitle="ניתן לבחור יותר מאפשרות אחת" />
              <div className="flex flex-wrap gap-2.5">
                {HEARD_ABOUT_OPTIONS.map((opt) => (
                  <CheckChip
                    key={opt}
                    label={HEARD_ABOUT_LABELS[opt]}
                    selected={state.heardAbout.includes(opt)}
                    onClick={() => toggleHeard(opt)}
                  />
                ))}
              </div>
              {state.heardAbout.includes("other") && (
                <OtherInput
                  value={state.heardAboutOther}
                  onChange={(v) => patch({ heardAboutOther: v })}
                />
              )}
            </div>
          )}

          {/* Step 7 - Done */}
          {step === 7 && (
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                ✓
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-primary">מוכן להתחיל!</h2>
                <p className="text-sm text-muted">הפרופיל שלך נשמר. המסלול מחכה לך.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(nextPath)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover"
              >
                התחלת הקורס ←
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Navigation */}
          {step <= TOTAL_STEPS && (
            <div className="mt-8 flex items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-muted transition hover:border-primary/30 hover:text-primary"
                >
                  ← הקודם
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext || submitting}
                className={cn(
                  "ms-auto rounded-xl px-6 py-3 text-sm font-bold transition",
                  canNext && !submitting
                    ? "bg-primary text-white shadow-sm hover:bg-primary-hover"
                    : "cursor-not-allowed bg-line text-muted/70",
                )}
              >
                {step === 6 ? (submitting ? "שומר..." : "סיום ✓") : "המשך ←"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Skip */}
      {step <= TOTAL_STEPS && (
        <p className="mt-4 text-center text-xs text-muted/70">
          <button
            type="button"
            onClick={() => router.push(nextPath)}
            className="underline-offset-2 hover:underline"
          >
            דלג על השאלון
          </button>
        </p>
      )}
    </div>
  );
}
