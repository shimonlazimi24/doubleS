import { redirect } from "next/navigation";
import { getManifestLesson } from "@/lib/amirant-course/manifest";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { PREP_BASE } from "@/lib/prep/constants";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

/** Redirect to pricing when the lesson's module requires paid access. */
export async function requireAmirantLessonAccess(lessonId: string): Promise<void> {
  const found = getManifestLesson(lessonId);
  if (!found) return;

  // דגל ה-dev/preview תקף גם בלי Supabase מקומי (הדגל ממילא מנוטרל בפרודקשן)
  let fullAccess = getPrepHasFullAccess();
  const client = fullAccess ? null : createPrepSupabaseServerClient();
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    fullAccess = await hasAmirantFullAccess(client, user?.id ?? null);
  }

  if (isAmirantModuleLocked(found.module, fullAccess)) {
    redirect(`${PREP_BASE}/pricing?module=${encodeURIComponent(found.module.slug)}`);
  }
}
