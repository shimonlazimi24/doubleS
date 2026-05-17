import { NextResponse } from "next/server";
import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getPrepHasFullAccess, getPrepShowCourseAssistant } from "@/lib/prep/prep-full-access";
import { hasAmirantFullAccess } from "@/lib/prep/entitlements";
import { checkAiRouteRateLimit, checkAiUserAndIpRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { runLessonChatAi } from "@/lib/amirant-course/ai/lesson-chat";
import { amirantChatbotRequestSchema } from "@/lib/amirant-course/ai/chatbot/schemas";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { requestIp, sessionId } = getAiRequestMeta(req);
  const {
    data: { user },
  } = await client.auth.getUser();

  const assistantAllowed =
    getPrepShowCourseAssistant() ||
    getPrepHasFullAccess() ||
    (user ? await hasAmirantFullAccess(client, user.id) : false);
  if (!assistantAllowed) {
    return NextResponse.json(
      { error: "עוזר הקורס זמין בקורס המלא (בתשלום). לפרטים: דף המחירים." },
      { status: 403 },
    );
  }

  if (user) {
    if (!(await checkAiUserAndIpRateLimit({ userId: user.id, ip: requestIp, route: "lesson-chat" }))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  } else {
    if (!(await checkAiRouteRateLimit({ key: `i:${requestIp}`, route: "lesson-chat-guest", maxRequests: 20 }))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = amirantChatbotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.issues } satisfies { error: string; details: unknown },
      { status: 400 },
    );
  }

  try {
    const data = await runLessonChatAi(client, user?.id ?? null, parsed.data, { requestIp, sessionId });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lesson chat failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
