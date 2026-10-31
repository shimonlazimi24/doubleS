import "server-only";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { assertServiceRoleKeyForWrites } from "@/lib/prep/supabase/service-role-check";
import {
  buildLearnerRows,
  type AdminLearnerRow,
  type AuthUserLite,
  type EntitlementRowLite,
  type OnboardingRowLite,
} from "./learner-rows";

const PER_PAGE = 1000;
/** 10 pages = 10,000 accounts. Past that this page needs server-side paging. */
const MAX_PAGES = 10;

export type LearnersLoad = {
  rows: AdminLearnerRow[];
  error: string | null;
  /** True when the account list hit MAX_PAGES and the table is not the full cohort. */
  truncated: boolean;
};

/**
 * Everyone who signed up, with their questionnaire answers and course access.
 * Reads through the service client: the onboarding and entitlement tables are
 * RLS-limited to their own owner. Callers are behind the admin layout gate.
 */
export async function loadAdminLearners(): Promise<LearnersLoad> {
  const service = getPrepSupabaseServiceClient();
  const keyStatus = assertServiceRoleKeyForWrites("admin/learners");
  if (!service || !keyStatus.ok) {
    return {
      rows: [],
      truncated: false,
      error: "מפתח ה-service של Supabase אינו מוגדר, ולכן אי אפשר לקרוא את רשימת הנרשמים.",
    };
  }

  const users: AuthUserLite[] = [];
  let truncated = false;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) return { rows: [], truncated: false, error: "קריאת רשימת החשבונות נכשלה." };
    const batch = data?.users ?? [];
    users.push(
      ...batch.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })),
    );
    if (batch.length < PER_PAGE) break;
    if (page === MAX_PAGES) truncated = true;
  }

  const [onboarding, entitlements] = await Promise.all([
    service
      .from("prep_learner_onboarding")
      .select(
        "user_id,sorting_exam_date,sorting_exam_date_unknown,institution_name,field_of_study,first_time_exam,first_time_exam_other,daily_study_time,daily_study_time_other,heard_about,heard_about_other,completed_at",
      )
      .limit(20_000),
    service
      .from("course_entitlements")
      .select("user_id,access_type,ends_at")
      .eq("course_slug", AMIRANT_PREPARATION_SLUG)
      .limit(20_000),
  ]);

  if (onboarding.error) {
    return { rows: [], truncated, error: "קריאת תשובות השאלון נכשלה." };
  }
  if (entitlements.error) {
    return { rows: [], truncated, error: "קריאת הרשאות הגישה נכשלה." };
  }

  return {
    error: null,
    truncated,
    rows: buildLearnerRows(
      users,
      (onboarding.data ?? []) as OnboardingRowLite[],
      (entitlements.data ?? []) as EntitlementRowLite[],
      Date.now(),
    ),
  };
}
