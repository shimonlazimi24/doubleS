import type { Metadata } from "next";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { assertServiceRoleKeyForWrites } from "@/lib/prep/supabase/service-role-check";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";
import { AdminLearnerTable, type AdminLearnerRow } from "@/components/prep/admin/AdminLearnerTable";

export const metadata: Metadata = { title: "נרשמים | PREPARE admin" };
export const dynamic = "force-dynamic";

type OnboardingRow = {
  user_id: string;
  sorting_exam_date: string | null;
  sorting_exam_date_unknown: boolean;
  institution_name: string;
  field_of_study: string;
  first_time_exam: string;
  first_time_exam_other: string | null;
  daily_study_time: string;
  daily_study_time_other: string | null;
  heard_about: string[];
  heard_about_other: string | null;
  completed_at: string;
};

type EntitlementRow = {
  user_id: string;
  access_type: string;
  ends_at: string | null;
};

const FIRST_TIME_LABEL: Record<string, string> = {
  yes: "פעם ראשונה",
  no: "נבחן בעבר",
  other: "אחר",
};

/**
 * The onboarding answers, for the whole cohort.
 *
 * `prep_learner_onboarding` is protected by RLS to the row's own owner, so this
 * page reads through the service client — the admin layout already gates it to
 * `app_metadata.is_admin`.
 */
async function loadLearners(): Promise<{ rows: AdminLearnerRow[]; error: string | null }> {
  const service = getPrepSupabaseServiceClient();
  const keyStatus = assertServiceRoleKeyForWrites("admin/learners");
  if (!service || !keyStatus.ok) {
    return {
      rows: [],
      error: "מפתח ה-service של Supabase אינו מוגדר, ולכן אי אפשר לקרוא את תשובות השאלון.",
    };
  }

  const { data: onboarding, error } = await service
    .from("prep_learner_onboarding")
    .select(
      "user_id,sorting_exam_date,sorting_exam_date_unknown,institution_name,field_of_study,first_time_exam,first_time_exam_other,daily_study_time,daily_study_time_other,heard_about,heard_about_other,completed_at",
    )
    .order("completed_at", { ascending: false })
    .limit(500);

  if (error) return { rows: [], error: `קריאת השאלון נכשלה: ${error.message}` };

  const rows = (onboarding ?? []) as OnboardingRow[];
  const userIds = rows.map((r) => r.user_id);

  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    // listUsers is paginated; one page of 1000 covers the launch cohort.
    const { data: users } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of users?.users ?? []) {
      if (user.email) emailById.set(user.id, user.email);
    }
  }

  const entitlementByUser = new Map<string, EntitlementRow>();
  if (userIds.length > 0) {
    const { data: entitlements } = await service
      .from("course_entitlements")
      .select("user_id,access_type,ends_at")
      .eq("course_slug", AMIRANT_PREPARATION_SLUG)
      .in("user_id", userIds);
    for (const row of (entitlements ?? []) as EntitlementRow[]) {
      entitlementByUser.set(row.user_id, row);
    }
  }

  const now = Date.now();
  return {
    error: null,
    rows: rows.map((row) => {
      const ent = entitlementByUser.get(row.user_id);
      const active =
        !!ent && (!ent.ends_at || Date.parse(ent.ends_at) > now) && ent.access_type !== "free";
      return {
        userId: row.user_id,
        email: emailById.get(row.user_id) ?? "—",
        examDate: row.sorting_exam_date_unknown ? "טרם ידוע" : (row.sorting_exam_date ?? "—"),
        institution: row.institution_name,
        field: row.field_of_study,
        firstTime:
          row.first_time_exam === "other" && row.first_time_exam_other
            ? row.first_time_exam_other
            : (FIRST_TIME_LABEL[row.first_time_exam] ?? row.first_time_exam),
        dailyStudyTime: row.daily_study_time_other || row.daily_study_time,
        heardAbout: [...(row.heard_about ?? []), row.heard_about_other]
          .filter((x): x is string => Boolean(x && x.trim()))
          .join(", "),
        completedAt: row.completed_at.slice(0, 10),
        paid: active,
        accessEndsAt: ent?.ends_at ? ent.ends_at.slice(0, 10) : null,
      };
    }),
  };
}

export default async function AdminLearnersPage() {
  const { rows, error } = await loadLearners();
  const paidCount = rows.filter((r) => r.paid).length;

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">נרשמים</h1>
        <p className="mt-1 text-sm text-muted">
          {rows.length} מילאו את שאלון הפתיחה · {paidCount} עם גישה בתשלום
        </p>
      </div>

      {error ? (
        <p className="rounded-surface border border-line bg-paper p-4 text-sm text-ink">{error}</p>
      ) : (
        <AdminLearnerTable rows={rows} />
      )}
    </div>
  );
}
