import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";
import { getPrepHasFullAccess } from "./prep-full-access";

export type CourseAccessType = "free" | "paid" | "admin";

export type CourseEntitlement = {
  courseSlug: string;
  accessType: CourseAccessType;
  active: boolean;
};

type EntitlementRow = {
  course_slug: string;
  access_type: CourseAccessType;
  starts_at: string;
  ends_at: string | null;
};

function isEntitlementActive(row: EntitlementRow, at = new Date()): boolean {
  const starts = Date.parse(row.starts_at);
  if (!Number.isNaN(starts) && starts > at.getTime()) return false;
  if (row.ends_at) {
    const ends = Date.parse(row.ends_at);
    if (!Number.isNaN(ends) && ends < at.getTime()) return false;
  }
  return true;
}

/**
 * The learner's entitlement for a course.
 *
 * Memoized per request (React `cache`, keyed by the client instance, user and
 * course): the course layout asks for it to decide on the assistant, and the
 * page asks again for its own gating. One database round trip serves both.
 * Outside a React request (route handlers, scripts) it simply runs each time.
 */
export const getCourseEntitlement = cache(async function getCourseEntitlement(
  client: SupabaseClient,
  userId: string,
  courseSlug: string,
): Promise<CourseEntitlement | null> {
  const { data, error } = await client
    .from("course_entitlements")
    .select("course_slug,access_type,starts_at,ends_at")
    .eq("user_id", userId)
    .eq("course_slug", courseSlug)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as EntitlementRow;
  return {
    courseSlug: row.course_slug,
    accessType: row.access_type,
    active: isEntitlementActive(row),
  };
});

export async function hasAmirantFullAccess(
  client: SupabaseClient | null,
  userId: string | null,
): Promise<boolean> {
  if (getPrepHasFullAccess()) return true;
  if (!client || !userId) return false;
  const ent = await getCourseEntitlement(client, userId, AMIRANT_PREPARATION_SLUG);
  if (!ent?.active) return false;
  return ent.accessType === "paid" || ent.accessType === "admin";
}

// ההענקה עצמה קורית ב-callback התשלום דרך grant_course_days (פונקציית SQL
// אטומית, ראו supabase/payments-schema.sql) - אין כאן helper הענקה כדי שלא
// ייווצר מסלול מקביל עם סמנטיקה שונה (איפוס starts_at / דריסת הארכות).
