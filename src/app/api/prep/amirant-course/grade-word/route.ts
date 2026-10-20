import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { gradeTypedWord } from "@/lib/amirant-course/word-formation/grade-word";
import { getWordFormationItem } from "@/lib/amirant-course/word-formation/word-formation.server";
import type { WordFormationGradeItem } from "@/lib/amirant-course/word-formation/types";

const bodySchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string().min(1).max(60), answer: z.string().max(80) }))
    .min(1)
    .max(8),
});

/**
 * Grades typed word-formation answers. These tests are the owner's paid sets,
 * so, like the reserved questions in the grade route, they are graded only for
 * full access: there is no free flow that uses them.
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
  const rateKey = userId ? `u:${userId}` : `i:${requestIp}`;
  if (!(await checkAiRouteRateLimit({ key: rateKey, route: "grade", maxRequests: client ? 60 : 30 }))) {
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

  if (!(await hasAmirantFullAccess(client, userId))) {
    return NextResponse.json({ error: "התרגול הזה זמין בגישה המלאה לקורס." }, { status: 403 });
  }

  const items: WordFormationGradeItem[] = [];
  for (const a of parsed.data.answers) {
    const key = getWordFormationItem(a.questionId);
    if (!key) return NextResponse.json({ error: "שאלה לא נמצאה" }, { status: 404 });
    const g = gradeTypedWord(key, a.answer);
    items.push({
      questionId: a.questionId,
      verdict: g.verdict,
      isCorrect: g.isCorrect,
      note: g.note,
      accepted: [...key.accepted],
      explanation: key.explanation,
    });
  }
  return NextResponse.json({ items, correct: items.filter((x) => x.isCorrect).length, total: items.length });
}
