import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { getPrepHasFullAccess } from "@/lib/prep/prep-full-access";
import { getWritingTask } from "@/lib/amirant-course/writing/writing-tasks.server";
import { gradeEssay, WRITING_MODEL } from "@/lib/amirant-course/writing/grade-essay.server";
import { getWritingStore, limitExceeded } from "@/lib/amirant-course/writing/submissions.server";
import { countWords, WRITING_LIMITS } from "@/lib/amirant-course/writing/types";

export const maxDuration = 60;

const bodySchema = z.object({
  taskId: z.string().min(1).max(60),
  text: z.string().min(1).max(WRITING_LIMITS.maxChars),
});

/**
 * A practice essay comes in, a verdict goes out.
 *
 * The grading itself takes about five seconds, so the request waits for it
 * (Next 14 has no `after()`); the page shows "המשוב מוכן תוך דקה" meanwhile.
 * The row is written before grading and completed after, so a grading failure
 * leaves a "failed" row the learner can see and retry, not a lost essay.
 *
 * Paid feature: the task and its reference essays are visible to the whole
 * paid module, the grader runs only with full access. Local development with
 * no Supabase works through the dev full-access flag and the in-memory store.
 */
export async function POST(req: Request) {
  const { requestIp } = getAiRequestMeta(req);
  const client = createPrepSupabaseServerClient();
  let userId: string | null = null;
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId && !getPrepHasFullAccess()) {
    return NextResponse.json({ error: "יש להתחבר כדי לשלוח חיבור לבדיקה." }, { status: 401 });
  }
  const effectiveUserId = userId ?? "local-dev";

  if (!(await checkAiRouteRateLimit({ key: `u:${effectiveUserId}`, route: "writing", maxRequests: 6, windowMs: 60_000 }))) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }
  if (!(await checkAiRouteRateLimit({ key: `i:${requestIp}`, route: "writing", maxRequests: 20, windowMs: 60_000 }))) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });

  const task = getWritingTask(parsed.data.taskId);
  if (!task) return NextResponse.json({ error: "מטלה לא נמצאה" }, { status: 404 });

  if (!(await hasAmirantFullAccess(client, userId))) {
    return NextResponse.json({ error: "הבדיקה זמינה בגישה המלאה לקורס." }, { status: 403 });
  }

  const text = parsed.data.text.trim();
  const words = countWords(text);
  if (words < WRITING_LIMITS.minWordsToGrade) {
    return NextResponse.json({ error: `החיבור קצר מדי לבדיקה (${words} מילים). כתבו לפחות ${WRITING_LIMITS.minWordsToGrade} מילים.` }, { status: 400 });
  }

  const { store, persistent } = getWritingStore();
  const counts = await store.countToday(effectiveUserId, task.id);
  const over = limitExceeded(counts);
  if (over === "task") {
    return NextResponse.json({ error: `עד ${WRITING_LIMITS.perTaskPerDay} הגשות למטלה ביום. נסו שוב מחר, או עברו למטלה אחרת.` }, { status: 429 });
  }
  if (over === "user") {
    return NextResponse.json({ error: `עד ${WRITING_LIMITS.perUserPerDay} חיבורים ביום. נסו שוב מחר.` }, { status: 429 });
  }

  const submission = await store.create(effectiveUserId, task.id, text, WRITING_MODEL);
  try {
    const result = await gradeEssay(task, text);
    await store.finish(submission.id, result);
    return NextResponse.json({
      submission: { ...submission, status: "graded", result, gradedAt: result.gradedAt },
      persistent,
    });
  } catch {
    await store.finish(submission.id, null).catch(() => undefined);
    return NextResponse.json(
      { error: "הבדיקה לא הצליחה הפעם. החיבור נשמר; נסו לשלוח שוב בעוד רגע.", submission: { ...submission, status: "failed" } },
      { status: 502 },
    );
  }
}
