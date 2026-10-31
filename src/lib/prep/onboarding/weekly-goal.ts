import type { OnboardingPayload } from "./schema";
import { DAILY_STUDY_LABELS } from "./schema";

export type WeeklyGoalPlan = {
  headline: string;
  detail: string;
  daysUntilExam: number | null;
};

/** Browser storage key shared by the wizard (draft) and the course home (dev-only answers). */
export const ONBOARDING_LOCAL_KEY = "prep_onboarding_v1";

export function daysUntilIsoDate(isoDate: string, now = new Date()): number {
  const target = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(target.getTime())) return NaN;
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function buildWeeklyGoalPlan(
  payload: Pick<OnboardingPayload, "sortingExamDate" | "sortingExamDateUnknown" | "dailyStudyTime">,
  now = new Date(),
): WeeklyGoalPlan {
  // "unknown" has the label "עוד לא יודע/ת", which cannot be dropped into "X ביום".
  const known = payload.dailyStudyTime !== "unknown" && DAILY_STUDY_LABELS[payload.dailyStudyTime];
  const daily = known ? `${known} ביום` : "גם חצי שעה ביום";
  if (payload.sortingExamDateUnknown || !payload.sortingExamDate) {
    return {
      headline: "יעד השבוע: קצב קבוע",
      detail: `${daily}: שיעור אחד ותרגול קצר על נושא חלש.`,
      daysUntilExam: null,
    };
  }
  const days = daysUntilIsoDate(payload.sortingExamDate, now);
  if (Number.isNaN(days)) {
    return {
      headline: "יעד השבוע",
      detail: `${daily}: שיעור ואז תרגול.`,
      daysUntilExam: null,
    };
  }
  if (days < 0) {
    return {
      headline: "תאריך המבחן כבר עבר",
      detail: "עדכנו את התאריך, או עברו לסימולציה מלאה כחימום אחרון.",
      daysUntilExam: days,
    };
  }
  if (days <= 7) {
    return {
      headline: `נשארו ${days} ימים למבחן`,
      detail: "השבוע: סימולציה אחת וסקירת הטעויות, בלי חומר חדש כבד.",
      daysUntilExam: days,
    };
  }
  if (days <= 30) {
    return {
      headline: `עוד ${days} ימים למבחן`,
      detail: `${daily}: ארבעה שיעורים השבוע ותרגול על הטעויות האחרונות.`,
      daysUntilExam: days,
    };
  }
  return {
    headline: `עוד ${days} ימים למבחן`,
    detail: `${daily}: אוצר מילים והפרק החלש, וסימולציות בחודש האחרון.`,
    daysUntilExam: days,
  };
}

export function readLocalOnboardingPayload(): OnboardingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { completed?: OnboardingPayload };
    return parsed.completed ?? null;
  } catch {
    return null;
  }
}
