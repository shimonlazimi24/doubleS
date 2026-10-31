import {
  DAILY_STUDY_LABELS,
  FIRST_TIME_LABELS,
  HEARD_ABOUT_LABELS,
} from "@/lib/prep/onboarding/schema";

/**
 * Joins three sources into one row per account: auth users (everyone who signed
 * up), onboarding answers (optional — many sign up and stop there), and the
 * course entitlement.
 *
 * The page used to start from the onboarding table, so an account that signed
 * in and never finished the questionnaire did not exist in the admin at all —
 * exactly the people worth following up with.
 */

export type AuthUserLite = { id: string; email?: string | null; created_at: string; last_sign_in_at?: string | null };

export type OnboardingRowLite = {
  user_id: string;
  sorting_exam_date: string | null;
  sorting_exam_date_unknown: boolean;
  institution_name: string | null;
  field_of_study: string | null;
  first_time_exam: string;
  first_time_exam_other: string | null;
  daily_study_time: string;
  daily_study_time_other: string | null;
  heard_about: string[] | null;
  heard_about_other: string | null;
  completed_at: string;
};

export type EntitlementRowLite = { user_id: string; access_type: string; ends_at: string | null };

export type AccessState = "paid" | "expired" | "admin" | "none";

export type AdminLearnerRow = {
  userId: string;
  email: string;
  signedUpAt: string;
  lastSignInAt: string | null;
  onboardedAt: string | null;
  examDate: string | null;
  examDateUnknown: boolean;
  firstTime: string;
  dailyStudyTime: string;
  /** Legacy answers from the longer questionnaire; empty for current sign-ups. */
  institution: string;
  field: string;
  heardAbout: string;
  access: AccessState;
  accessEndsAt: string | null;
};

/** The wizard wrote this placeholder once it stopped asking these two questions. */
const NOT_GIVEN = "לא צוין";

function legacyValue(v: string | null | undefined): string {
  const t = (v ?? "").trim();
  return t && t !== NOT_GIVEN ? t : "";
}

export function accessState(ent: EntitlementRowLite | undefined, now: number): AccessState {
  if (!ent || ent.access_type === "free") return "none";
  const live = !ent.ends_at || Date.parse(ent.ends_at) > now;
  if (ent.access_type === "admin") return live ? "admin" : "expired";
  return live ? "paid" : "expired";
}

export function buildLearnerRows(
  users: AuthUserLite[],
  onboarding: OnboardingRowLite[],
  entitlements: EntitlementRowLite[],
  now: number,
): AdminLearnerRow[] {
  const answers = new Map(onboarding.map((r) => [r.user_id, r]));
  const ents = new Map(entitlements.map((r) => [r.user_id, r]));

  return users
    .map((user) => {
      const a = answers.get(user.id);
      const ent = ents.get(user.id);
      const firstTime = !a
        ? ""
        : a.first_time_exam === "other" && a.first_time_exam_other
          ? a.first_time_exam_other
          : (FIRST_TIME_LABELS[a.first_time_exam as keyof typeof FIRST_TIME_LABELS] ?? a.first_time_exam);
      const daily = !a
        ? ""
        : a.daily_study_time_other ||
          (DAILY_STUDY_LABELS[a.daily_study_time as keyof typeof DAILY_STUDY_LABELS] ?? a.daily_study_time);
      const heard = !a
        ? ""
        : [
            ...(a.heard_about ?? []).map(
              (s) => HEARD_ABOUT_LABELS[s as keyof typeof HEARD_ABOUT_LABELS] ?? s,
            ),
            a.heard_about_other,
          ]
            .filter((x): x is string => Boolean(x && x.trim()))
            .join(", ");
      return {
        userId: user.id,
        email: user.email ?? "",
        signedUpAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        onboardedAt: a?.completed_at ?? null,
        examDate: a && !a.sorting_exam_date_unknown ? a.sorting_exam_date : null,
        examDateUnknown: Boolean(a?.sorting_exam_date_unknown),
        firstTime,
        dailyStudyTime: daily,
        institution: legacyValue(a?.institution_name),
        field: legacyValue(a?.field_of_study),
        heardAbout: heard,
        access: accessState(ent, now),
        accessEndsAt: ent?.ends_at ?? null,
      } satisfies AdminLearnerRow;
    })
    .sort((x, y) => Date.parse(y.signedUpAt) - Date.parse(x.signedUpAt));
}

export type LearnerTotals = { signedUp: number; onboarded: number; paidActive: number };

export function learnerTotals(rows: AdminLearnerRow[]): LearnerTotals {
  return {
    signedUp: rows.length,
    onboarded: rows.filter((r) => r.onboardedAt).length,
    paidActive: rows.filter((r) => r.access === "paid").length,
  };
}
