import { createPrepSupabaseServerClient } from "@/lib/prep/supabase/server";
import { getPrepHasFullAccess, getPrepShowCourseAssistant } from "@/lib/prep/prep-full-access";
import { checkAiRouteRateLimit, checkAiUserAndIpRateLimit } from "@/lib/amirant-course/ai/rate-limit";
import { runLessonChatAi } from "@/lib/amirant-course/ai/lesson-chat";
import { amirantChatbotRequestSchema } from "@/lib/amirant-course/ai/chatbot/schemas";
import { getAiRequestMeta } from "@/lib/amirant-course/ai/ai-http";

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const client = createPrepSupabaseServerClient();
  if (!client) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const { requestIp, sessionId } = getAiRequestMeta(req);
  const { data: { user } } = await client.auth.getUser();

  const isLoggedIn = !!user;
  const assistantAllowed = getPrepShowCourseAssistant() || getPrepHasFullAccess() || isLoggedIn;
  if (!assistantAllowed) {
    return new Response(JSON.stringify({ error: "עוזר הקורס זמין למשתמשים מחוברים. התחברו כדי להמשיך." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (user) {
    if (!(await checkAiUserAndIpRateLimit({ userId: user.id, ip: requestIp, route: "lesson-chat" }))) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { "Content-Type": "application/json" } });
    }
  } else {
    if (!(await checkAiRouteRateLimit({ key: `i:${requestIp}`, route: "lesson-chat-guest", maxRequests: 20 }))) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { "Content-Type": "application/json" } });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const parsed = amirantChatbotRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid body", details: parsed.error.issues }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream SSE: first token arrives to client within ~100ms; answer text streams as it's generated
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: unknown) => controller.enqueue(enc.encode(sseEvent(data)));

      // Immediately acknowledge so client shows "thinking" without waiting for embedding/RAG
      send({ t: "ack" });

      try {
        const result = await runLessonChatAi(
          client,
          user?.id ?? null,
          parsed.data,
          { requestIp, sessionId },
          (delta) => send({ t: "tok", v: delta }),
        );
        send({ t: "done", d: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lesson chat failed";
        send({ t: "err", e: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
