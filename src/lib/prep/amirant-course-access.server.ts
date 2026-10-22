import { redirect } from "next/navigation";
import { AMIRANT_PREPARATION_MANIFEST, getManifestLesson, getManifestQuiz } from "@/lib/amirant-course/manifest";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { ensureTesterEntitlement } from "@/lib/prep/ensure-tester-entitlement.server";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPrepServerUser } from "@/lib/prep/supabase/server";

/**
 * Server-side access gates for the paid parts of the course.
 *
 * Until 2026-08-20 only `/course/lesson/[lessonId]` checked entitlement. Every
 * quiz, practice set, simulation, weak-quiz and analytics page was reachable by
 * any signed-in account, so the practice product — the part being sold — was
 * free to anyone who created an account. Reported from production:
 * "אפשר להתחבר עם כל מייל בלי לשלם ואתה ישר מתחבר".
 *
 * What stays open on purpose: the course home, the free intro module, the entry
 * placement test (advertised as free, no card), the learner's own dashboard and
 * their own attempt review.
 *
 * The lesson gate differs from the others in one way: it is where testers
 * listed in PREP_TESTER_EMAILS receive their entitlement, on their first paid
 * lesson, before the check runs.
 */

/** The placement test is the funnel entry and is advertised as free. */
export const AMIRANT_FREE_QUIZ_IDS = new Set<string>(["quiz-entry-diagnostic"]);

function pricingUrl(moduleSlug?: string): string {
  const base = `${PREP_BASE}/pricing`;
  return moduleSlug ? `${base}?module=${encodeURIComponent(moduleSlug)}` : base;
}

export async function getAmirantFullAccess(): Promise<boolean> {
  if (getPrepHasFullAccess()) return true;
  // Shared with the course pages: one auth call and one entitlement read per request.
  const { client, user } = await getPrepServerUser();
  if (!client) return false;
  return hasAmirantFullAccess(client, user?.id ?? null);
}

/** Redirects to pricing unless the learner has paid access. */
export async function requireAmirantFullAccess(moduleSlug?: string): Promise<void> {
  if (await getAmirantFullAccess()) return;
  redirect(pricingUrl(moduleSlug));
}

/** Quizzes are paid except the entry placement test. */
export async function requireAmirantQuizAccess(quizId: string): Promise<void> {
  if (AMIRANT_FREE_QUIZ_IDS.has(quizId)) return;
  const quiz = getManifestQuiz(quizId);
  if (quiz?.format === "fixed_placement") return;

  const moduleSlug = AMIRANT_PREPARATION_MANIFEST.modules.find((m) =>
    m.quizzes.some((q) => q.id === quizId),
  )?.slug;
  await requireAmirantFullAccess(moduleSlug);
}

/** Redirects to pricing when the lesson's module requires paid access. */
export async function requireAmirantLessonAccess(lessonId: string): Promise<void> {
  const found = getManifestLesson(lessonId);
  if (!found) return;

  // A free module needs no auth at all: decide that before touching the database.
  if (!isAmirantModuleLocked(found.module, false)) return;

  // The dev/preview flag also holds without a local Supabase (it is off in production anyway).
  let fullAccess = getPrepHasFullAccess();
  if (!fullAccess) {
    const { client, user } = await getPrepServerUser();
    // Testers listed in PREP_TESTER_EMAILS get their entitlement on their first paid lesson.
    if (client && user) await ensureTesterEntitlement(client, user);
    fullAccess = client ? await hasAmirantFullAccess(client, user?.id ?? null) : false;
  }

  if (isAmirantModuleLocked(found.module, fullAccess)) {
    redirect(pricingUrl(found.module.slug));
  }
}
