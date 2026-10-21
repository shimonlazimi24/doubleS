import { redirect } from "next/navigation";
import { getManifestLesson } from "@/lib/amirant-course/manifest";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPrepServerUser } from "@/lib/prep/supabase/server";

/** Redirect to pricing when the lesson's module requires paid access. */
export async function requireAmirantLessonAccess(lessonId: string): Promise<void> {
  const found = getManifestLesson(lessonId);
  if (!found) return;

  // A free module needs no auth at all: decide that before touching the database.
  if (!isAmirantModuleLocked(found.module, false)) return;

  // דגל ה-dev/preview תקף גם בלי Supabase מקומי (הדגל ממילא מנוטרל בפרודקשן)
  let fullAccess = getPrepHasFullAccess();
  if (!fullAccess) {
    // Shared with the course layout: one auth call and one entitlement read per request.
    const { client, user } = await getPrepServerUser();
    fullAccess = client ? await hasAmirantFullAccess(client, user?.id ?? null) : false;
  }

  if (isAmirantModuleLocked(found.module, fullAccess)) {
    redirect(`${PREP_BASE}/pricing?module=${encodeURIComponent(found.module.slug)}`);
  }
}
