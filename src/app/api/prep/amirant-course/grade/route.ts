import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getBankQuestion } from "@/lib/amirant-course/question-bank";
import { getDemoCorrectOptionId } from "@/lib/prep/amirant-demo/demo-answers.server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";

function resolveCorrect(questionId: string): { correctOptionId: string; explanation: string | null } | null {
  const row = getBankQuestion(questionId);
  if (row) return { correctOptionId: row.correctOptionId, explanation: row.explanation };
  const demo = getDemoCorrectOptionId(questionId);
  if (demo) return { correctOptionId: demo, explanation: null };
  return null;
}

const checkSchema = z.object({
  mode: z.literal("check"),
  questionId: z.string().min(1).max(120),
  selectedOptionId: z.string().min(1).max(40),
});

const batchSchema = z.object({
  mode: z.literal("batch"),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(120),
        selectedOptionId: z.string().min(1).max(40).nullable(),
      }),
    )
    .min(1)
    .max(80),
  reveal: z.boolean().optional(),
});

const bodySchema = z.discriminatedUnion("mode", [checkSchema, batchSchema]);

/**
 * Server-side grading — answer keys never ship to the browser.
 * check: single mid-quiz correctness (adaptive level)
 * batch: finalize / practice / inline reveal
 */
export async function POST(req: Request) {
  const { requestIp } = getAiRequestMeta(req);
  const client = createPrepSupabaseServerClient();
  // Grading is allowed for anonymous preview quizzes, but rate-limited hard.
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    const key = user?.id ? `u:${user.id}` : `i:${requestIp}`;
    if (!(await checkAiRouteRateLimit({ key, route: "grade", maxRequests: 60 }))) {
      return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
    }
  } else if (!(await checkAiRouteRateLimit({ key: `i:${requestIp}`, route: "grade", maxRequests: 30 }))) {
    return NextResponse.json({ error: "יותר מדי בקשות. המתינו רגע." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON לא תקין" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (parsed.data.mode === "check") {
    const resolved = resolveCorrect(parsed.data.questionId);
    if (!resolved) return NextResponse.json({ error: "שאלה לא נמצאה" }, { status: 404 });
    const isCorrect = resolved.correctOptionId === parsed.data.selectedOptionId;
    return NextResponse.json({ isCorrect });
  }

  const batch = parsed.data;
  const reveal = batch.reveal === true;
  const items = batch.answers.map((a) => {
    const resolved = resolveCorrect(a.questionId);
    if (!resolved || a.selectedOptionId == null) {
      return {
        questionId: a.questionId,
        isCorrect: false,
        ...(reveal
          ? {
              correctOptionId: resolved?.correctOptionId ?? null,
              explanation: resolved?.explanation ?? null,
            }
          : {}),
      };
    }
    const isCorrect = resolved.correctOptionId === a.selectedOptionId;
    return {
      questionId: a.questionId,
      isCorrect,
      ...(reveal
        ? { correctOptionId: resolved.correctOptionId, explanation: resolved.explanation }
        : {}),
    };
  });

  const answered = items.filter((_, i) => batch.answers[i]?.selectedOptionId != null);
  const correct = answered.filter((x) => x.isCorrect).length;
  const scorePercent = answered.length ? Math.round((100 * correct) / answered.length) : 0;

  return NextResponse.json({ items, correct, total: answered.length, scorePercent });
}
