import type { SupabaseClient } from "@supabase/supabase-js";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";
import { getPrepSupabaseServiceClient } from "@/lib/prep/supabase/service";
import { getCourseEntitlement } from "@/lib/prep/entitlements";
import { isPrepTesterEmail } from "@/lib/prep/tester-allowlist";

/**
 * הענקת גישת בודק אוטומטית: אם המייל ב-`PREP_TESTER_EMAILS` ואין כבר
 * entitlement פעיל - נכתבת שורת 'admin' לשנה (service client; RLS לא מתירה
 * למשתמשים לכתוב לעצמם). רץ מ-layout הקורס בכל ביקור - זול (בדיקה אחת)
 * ואידמפוטנטי. לא נוגע ב-entitlement פעיל קיים (בודק שקנה לא יידרס).
 */
export async function ensureTesterEntitlement(
  sessionClient: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<void> {
  if (!isPrepTesterEmail(user.email)) return;
  try {
    const existing = await getCourseEntitlement(sessionClient, user.id, AMIRANT_PREPARATION_SLUG);
    if (existing?.active) return;
    const service = getPrepSupabaseServiceClient();
    if (!service) return;
    await service.from("course_entitlements").upsert(
      {
        user_id: user.id,
        course_slug: AMIRANT_PREPARATION_SLUG,
        access_type: "admin",
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id,course_slug" },
    );
  } catch {
    // הענקת בודק היא נוחות - כשל שקט לא חוסם את הקורס
  }
}
