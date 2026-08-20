import { redirect } from "next/navigation";
import { AMIRANT_PREPARATION_MANIFEST, getManifestQuiz } from "@/lib/amirant-course/manifest";
import { isAmirantModuleLocked } from "@/lib/prep/course-access";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { PREP_BASE } from "@/lib/prep/constants";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";

/**
 * Server-side access gate for the paid parts of the course.
 *
 * Until now only `/course/lesson/[lessonId]` checked entitlement. Every quiz,
 * practice set, simulation, weak-quiz and analytics page was reachable by any
 * signed-in account, so the practice product — the part being sold — was free
 * to anyone who created an account. Reported from production on 2026-08-20:
 * "אפשר להתחבר עם כל מייל בלי לשלם ואתה ישר מתחבר".
 *
 * What stays open on purpose: the course home, the free intro module, the entry
 * placement test (advertised as free, no card), the learner's own dashboard and
 * their own attempt review.
 */

/** The placement test is the funnel entry and is advertised as free. */
export const AMIRANT_FREE_QUIZ_IDS = new Set<string>(["quiz-entry-diagnostic"]);

export async function getAmirantFullAccess(): Promise<boolean> {
  if (getPrepHasFullAccess()) return true;
  const client = createPrepSupabaseServerClient();
  if (!client) return false;
  const {
    data: { user },
  } = await client.auth.getUser();
  return hasAmirantFullAccess(client, user?.id ?? null);
}

function pricingUrl(moduleSlug?: string): string {
  const base = `${PREP_BASE}/pricing`;
  return moduleSlug ? `${base}?module=${encodeURIComponent(moduleSlug)}` : base;
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
