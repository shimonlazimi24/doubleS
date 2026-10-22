import { NextResponse } from "next/server";
import { z } from "zod";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getBankQuestion } from "@/lib/amirant-course/question-bank";
import { clientQuestionSetFor } from "@/lib/amirant-course/question-bank/for-client.server";
import { mayReadQuestion, QUESTION_SET_MAX_IDS } from "@/lib/amirant-course/question-access";
import { checkAiRouteRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import type { BankQuestion } from "@/lib/amirant-course/types/bank-question";

const bodySchema = z.object({
  ids: z.array(z.string().min(1).max(120)).min(1).max(QUESTION_SET_MAX_IDS),
});

const TOO_MANY = "יותר מדי בקשות. המתינו רגע.";
const NO_ACCESS = "השאלה זמינה למנויים בלבד";

/**
 * Public rows (stem, options, topic, level, passage) for ids the browser chose
 * from a pool it was given — no answer keys, those stay behind `/grade`.
 * Who may read what is decided per question in `question-access.ts`.
 */
export async function POST(req: Request) {
  const { requestIp } = getAiRequestMeta(req);
  const client = createPrepSupabaseServerClient();
  let userId: string | null = null;
  // The free placement test fetches its form anonymously; rate-limited like grading.
  if (client) {
    const {
      data: { user },
    } = await client.auth.getUser();
    userId = user?.id ?? null;
  }
  const rateKey = userId ? `u:${userId}` : `i:${requestIp}`;
  if (!(await checkAiRouteRateLimit({ key: rateKey, route: "questions", maxRequests: client ? 60 : 30 }))) {
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

  // Unknown ids are dropped, as the browser bank used to do; order is kept.
  const rows = parsed.data.ids
    .map((id) => getBankQuestion(id))
    .filter((q): q is BankQuestion => q != null);

  // The entitlement lookup costs a query; a general-bank-only request skips it.
  const needsAccess = rows.some((q) => !mayReadQuestion({ tags: q.tags, hasFullAccess: false }));
  const hasFullAccess = needsAccess ? await hasAmirantFullAccess(client, userId) : false;
  if (rows.some((q) => !mayReadQuestion({ tags: q.tags, hasFullAccess }))) {
    return NextResponse.json({ error: NO_ACCESS }, { status: 403 });
  }

  return NextResponse.json(clientQuestionSetFor(rows));
}
