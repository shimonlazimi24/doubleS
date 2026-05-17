"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    if (!q) return options.slice(0, 12);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 12);
  }, [value, options]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="text-right"
          dir="rtl"
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-line bg-paper shadow-lg">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-right text-sm hover:bg-surface-low"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt);
                    setOpen(false);
                  }}
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
        if (!state.dailyStudyTime) return false;
        if (state.dailyStudyTime === "other") return state.dailyStudyTimeOther.trim().length > 0;
        return true;
      case 6:
        if (state.heardAbout.length === 0) return false;
        if (state.heardAbout.includes("other") && !state.heardAboutOther.trim()) return false;
        return true;
      default:
        return true;
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
      setError("שגיאת רשת");
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (!canNext) return;
    if (step === 6) {
      void submit();
      return;
    }
    setStep((s) => s + 1);
  };

  const onBack = () => {
    if (step > 1 && step < 7) setStep((s) => s - 1);
  };

  const toggleHeard = (key: (typeof HEARD_ABOUT_OPTIONS)[number]) => {
    setState((s) => {
      const has = s.heardAbout.includes(key);
      return {
        ...s,
        heardAbout: has ? s.heardAbout.filter((h) => h !== key) : [...s.heardAbout, key],
      };
    });
  };

  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-line bg-paper p-6 shadow-card md:p-8">
      {step <= TOTAL_STEPS && (
        <p className="mb-6 text-center text-sm text-muted">
          שלב {step} מתוך {TOTAL_STEPS}
        </p>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-center text-xl font-bold">מתי מבחן המיון שלך?</h2>
          <div className="space-y-2">
            <label htmlFor="exam-date" className="text-sm font-medium">
              תאריך
            </label>
            <Input
              id="exam-date"
              type="date"
              disabled={state.sortingExamDateUnknown}
              value={state.sortingExamDate}
              onChange={(e) => patch({ sortingExamDate: e.target.value, sortingExamDateUnknown: false })}
              dir="ltr"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={state.sortingExamDateUnknown}
              onChange={(e) =>
                patch({
                  sortingExamDateUnknown: e.target.checked,
                  sortingExamDate: e.target.checked ? "" : state.sortingExamDate,
                })
              }
              className="size-4 rounded border-line"
            />
            <span>לא ידוע</span>
          </label>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-4 text-center text-xl font-bold">באיזה מוסד לימודים את/ה לומד/ת?</h2>
          <AutocompleteInput
            id="institution"
            label="שם המוסד"
            value={state.institutionName}
            onChange={(v) => patch({ institutionName: v })}
            options={INSTITUTIONS}
            placeholder="הקלידו או בחרו מהרשימה"
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="mb-4 text-center text-xl font-bold">מה תחום הלימודים שלך?</h2>
          <AutocompleteInput
            id="field"
            label="תחום לימודים"
            value={state.fieldOfStudy}
            onChange={(v) => patch({ fieldOfStudy: v })}
            options={FIELDS}
            placeholder="למשל: הנדסת תוכנה"
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-center text-xl font-bold">האם זו הפעם הראשונה שאת/ה נבחנ/ת במבחן?</h2>
          <div className="flex flex-col gap-2">
            {FIRST_TIME_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => patch({ firstTimeExam: opt })}
                className={cn(
                  "rounded-lg border px-4 py-3 text-right transition",
                  state.firstTimeExam === opt ? "border-primary bg-primary-muted" : "border-line hover:bg-surface-low",
                )}
              >
                {FIRST_TIME_LABELS[opt]}
              </button>
            ))}
          </div>
          {state.firstTimeExam === "other" && (
            <Input
              value={state.firstTimeExamOther}
              onChange={(e) => patch({ firstTimeExamOther: e.target.value })}
              placeholder="פרטו..."
              className="text-right"
              dir="rtl"
            />
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-center text-xl font-bold">כמה זמן ביום את/ה מתכננ/ת ללמוד?</h2>
          <div className="flex flex-col gap-2">
            {DAILY_STUDY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => patch({ dailyStudyTime: opt })}
                className={cn(
                  "rounded-lg border px-4 py-3 text-right transition",
                  state.dailyStudyTime === opt ? "border-primary bg-primary-muted" : "border-line hover:bg-surface-low",
                )}
              >
                {DAILY_STUDY_LABELS[opt]}
              </button>
            ))}
          </div>
          {state.dailyStudyTime === "other" && (
            <Input
              value={state.dailyStudyTimeOther}
              onChange={(e) => patch({ dailyStudyTimeOther: e.target.value })}
              placeholder="פרטו..."
              className="text-right"
              dir="rtl"
            />
          )}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <h2 className="text-center text-xl font-bold">איך שמעת עלינו?</h2>
          <p className="text-center text-sm text-muted">ניתן לבחור יותר מאפשרות אחת</p>
          <div className="flex flex-col gap-2">
            {HEARD_ABOUT_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleHeard(opt)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-right transition",
                  state.heardAbout.includes(opt) ? "border-primary bg-primary-muted" : "border-line hover:bg-surface-low",
                )}
              >
                {HEARD_ABOUT_LABELS[opt]}
              </button>
            ))}
          </div>
          {state.heardAbout.includes("other") && (
            <Input
              value={state.heardAboutOther}
              onChange={(e) => patch({ heardAboutOther: e.target.value })}
              placeholder="פרטו..."
              className="text-right"
              dir="rtl"
            />
          )}
        </div>
      )}

      {step === 7 && (
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-bold">מעולה! סיימנו</h2>
          <p className="text-muted">עכשיו אפשר להתחיל את מסלול ההכנה שלך.</p>
          <Button variant="primary" className="w-full px-6 py-3 text-base" onClick={() => router.push(nextPath)} disabled={submitting}>
            התחלת הקורס
          </Button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {step <= TOTAL_STEPS && (
        <div className="mt-8 flex gap-3">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={onBack}>
              → חזרה
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" variant="primary" className="ms-auto" onClick={onNext} disabled={!canNext || submitting}>
            {step === 6 ? (submitting ? "שומר..." : "סיום") : "המשך ←"}
          </Button>
        </div>
      )}
    </div>
  );
}
