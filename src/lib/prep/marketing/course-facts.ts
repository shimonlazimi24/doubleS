import { AMIRANT_PREPARATION_MANIFEST, countManifestLessons } from "@/lib/amirant-course";
import { AMIRANT_BANK_QUESTIONS } from "@/lib/amirant-course/question-bank";
import { PLAN_DAYS, PLAN_LABELS, PLAN_PRICES_NIS } from "@/lib/prep/pricing-plans";

/**
 * The numbers the marketing pages state about the course, computed from the
 * course itself so they cannot drift from what a learner actually gets.
 * Server only (the bank is not shipped to the browser).
 */

const PRACTICE_UNIT = /^lesson\.(sc\.test|rephrase\.set|reading\.passage|reform\.wf)-\d+$/;

const lessons = AMIRANT_PREPARATION_MANIFEST.modules.flatMap((m) => m.lessons);

export const COURSE_FACTS = {
  modules: AMIRANT_PREPARATION_MANIFEST.modules.length,
  lessons: countManifestLessons(AMIRANT_PREPARATION_MANIFEST),
  practiceUnits: lessons.filter((l) => PRACTICE_UNIT.test(l.id)).length,
  simulations: AMIRANT_PREPARATION_MANIFEST.simulations.length,
  questions: AMIRANT_BANK_QUESTIONS.length,
  hours: Math.round(lessons.reduce((s, l) => s + (l.estimatedMinutes ?? 0), 0) / 60),
} as const;

export type MarketingPlan = { id: string; label: string; days: number; priceNis: number; perDay: number };

/** The three access plans, in price order. Extensions are not sold on the marketing pages. */
export const MARKETING_PLANS: MarketingPlan[] = ["week", "two_weeks", "month"].map((id) => ({
  id,
  label: PLAN_LABELS[id] ?? id,
  days: PLAN_DAYS[id],
  priceNis: PLAN_PRICES_NIS[id],
  perDay: Math.round(PLAN_PRICES_NIS[id] / PLAN_DAYS[id]),
}));
