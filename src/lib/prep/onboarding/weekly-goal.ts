import type { OnboardingPayload } from "./schema";
import { DAILY_STUDY_LABELS } from "./schema";

export type WeeklyGoalPlan = {
  headline: string;
  detail: string;
  daysUntilExam: number | null;
};

const LOCAL_KEY = "prep_onboarding_v1";

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
  const daily = DAILY_STUDY_LABELS[payload.dailyStudyTime] ?? "זמן לימוד";
  if (payload.sortingExamDateUnknown || !payload.sortingExamDate) {
    return {
      headline: "יעד השבוע: קצב קבוע",
      detail: `בחרתם ${daily} ביום. השלימו שיעור אחד + תרגול קצר על נושא חלש.`,
      daysUntilExam: null,
    };
  }
  const days = daysUntilIsoDate(payload.sortingExamDate, now);
  if (Number.isNaN(days)) {
    return {
      headline: "יעד השבוע",
      detail: `הקדישו ${daily} ביום — שיעור ואז תרגול.`,
      daysUntilExam: null,
    };
  }
  if (days < 0) {
    return {
      headline: "תאריך המבחן כבר עבר",
      detail: "עדכנו תאריך בהיכרות, או עברו לסימולציה מלאה כחימום אחרון.",
      daysUntilExam: days,
    };
  }
  if (days <= 7) {
    return {
      headline: `נשארו ${days} ימים למבחן`,
      detail: "השבוע: סימולציה אחת + סקירת טעויות. בלי חומר חדש כבד.",
      daysUntilExam: days,
    };
  }
  if (days <= 30) {
    return {
      headline: `עוד ${days} ימים למבחן`,
      detail: `${daily} ביום · 4 שיעורים השבוע + תרגול על הטעויות האחרונות.`,
      daysUntilExam: days,
    };
  }
  return {
    headline: `עוד ${days} ימים — מסלול רגוע`,
    detail: `${daily} ביום · התמקדו באוצר מילים ובפרק החלש, ושמרו סימולציה לחודש האחרון.`,
    daysUntilExam: days,
  };
}

export function readLocalOnboardingPayload(): OnboardingPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { completed?: OnboardingPayload };
    return parsed.completed ?? null;
  } catch {
    return null;
  }
}
