import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getBankQuestion } from "@/lib/amirant-course/question-bank";
import { getDemoCorrectOptionId } from "@/lib/prep/amirant-demo/demo-answers.server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import {
  decideGradeAccess,
  freeBatchShapeError,
  type GradeMode,
  type GradeQuestionSource,
} from "@/lib/amirant-course/grade-access";

type Resolved = {
  correctOptionId: string;
  explanation: string | null;
  source: GradeQuestionSource;
};

function resolveCorrect(questionId: string): Resolved | null {
  const row = getBankQuestion(questionId);
  if (row) {
    return {
      correctOptionId: row.correctOptionId,
      explanation: row.explanation,
      source: { kind: "bank", tags: row.tags },
    };
  }
  const demo = getDemoCorrectOptionId(questionId);
  if (demo) return { correctOptionId: demo, explanation: null, source: { kind: "demo" } };
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

const TOO_MANY = "יותר מדי בקשות. המתינו רגע.";
const NO_ACCESS = "השאלה זמינה למנויים בלבד";

/**
 * Server-side grading — answer keys never ship to the browser.
 * check: single mid-quiz correctness (adaptive level)
 * batch: finalize / practice / inline reveal
 *
 * Who may grade and see what is decided per question in `grade-access.ts`.
 * Without full access a `reveal` batch still grades (the free placement test
 * always asks for reveal and needs right/wrong for its score), it just comes
 * back without `correctOptionId` and `explanation`.
 */
export async function POST(req: Request) {
  const { requestIp } = getAiRequestMeta(req);
  const client = createPrepSupabaseServerClient();
  let userId: string | null = null;
  // Grading is allowed for anonymous preview quizzes, but rate-limited hard.
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }
  const rateKey = userId ? `u:${userId}` : `i:${requestIp}`;
  if (!(await checkAiRouteRateLimit({ key: rateKey, route: "grade", maxRequests: client ? 60 : 30 }))) {
    return NextResponse.json({ error: TOO_MANY }, { status: 429 });
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

  const mode: GradeMode = parsed.data.mode;
  const questionIds =
    parsed.data.mode === "check" ? [parsed.data.questionId] : parsed.data.answers.map((a) => a.questionId);
  const resolvedById = new Map(questionIds.map((id) => [id, resolveCorrect(id)]));

  // The entitlement lookup costs a query; demo-only and unknown-only requests skip it.
  const needsAccess = Array.from(resolvedById.values()).some((r) => r?.source.kind === "bank");
  const hasFullAccess = needsAccess ? await hasAmirantFullAccess(client, userId) : false;

  const decide = (r: Resolved | null) =>
    decideGradeAccess({ source: r?.source ?? { kind: "unknown" }, mode, hasFullAccess });

  if (Array.from(resolvedById.values()).some((r) => !decide(r).grade)) {
    return NextResponse.json({ error: NO_ACCESS }, { status: 403 });
  }

  if (parsed.data.mode === "check") {
    const resolved = resolvedById.get(parsed.data.questionId);
    if (!resolved) return NextResponse.json({ error: "שאלה לא נמצאה" }, { status: 404 });
    const isCorrect = resolved.correctOptionId === parsed.data.selectedOptionId;
    return NextResponse.json({ isCorrect });
  }

  if (needsAccess && !hasFullAccess) {
    if (freeBatchShapeError(questionIds)) {
      return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
    }
    // A free batch is one placement test finalized: a few per ten minutes is plenty
    // for a real learner and slows anyone trying options one batch at a time.
    if (!(await checkAiRouteRateLimit({ key: rateKey, route: "grade-free", windowMs: 10 * 60_000, maxRequests: 10 }))) {
      return NextResponse.json({ error: TOO_MANY }, { status: 429 });
    }
  }

  const batch = parsed.data;
  const askedReveal = batch.reveal === true;
  const items = batch.answers.map((a) => {
    const resolved = resolvedById.get(a.questionId) ?? null;
    const reveal = askedReveal && decide(resolved).reveal;
    const isCorrect =
      resolved != null && a.selectedOptionId != null && resolved.correctOptionId === a.selectedOptionId;
    return {
      questionId: a.questionId,
      isCorrect,
      ...(reveal
        ? { correctOptionId: resolved?.correctOptionId ?? null, explanation: resolved?.explanation ?? null }
        : {}),
    };
  });

  const answered = items.filter((_, i) => batch.answers[i]?.selectedOptionId != null);
  const correct = answered.filter((x) => x.isCorrect).length;
  const scorePercent = answered.length ? Math.round((100 * correct) / answered.length) : 0;

  return NextResponse.json({ items, correct, total: answered.length, scorePercent });
}
