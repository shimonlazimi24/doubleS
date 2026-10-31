import type { SupabaseClient } from "@supabase/supabase-js";
import { runAmirantChatbot, redactChatRequest } from "./chatbot";
import { AI_PROMPT_VERSION } from "./prompts";
import { amirantChatbotRequestSchema } from "./chatbot/schemas";
import { lessonChatResponseSchema, type LessonChatResponse } from "./schemas";
import type { AiRequestLogContext } from "./ai-request-context";

/**
 * Amirant course assistant: intent routing, RAG, staged hints, performance, vocabulary (see `ai/chatbot/`).
 */
export async function runLessonChatAi(
  /** `null` only in local dev without Supabase: guest, no RAG, no learner stats. */
  client: SupabaseClient | null,
  userId: string | null,
  raw: unknown,
  logCtx?: AiRequestLogContext,
  onToken?: (delta: string) => void,
): Promise<LessonChatResponse> {
  const output = await runAmirantChatbot(client, userId, raw, logCtx, onToken);
  const model = "amirant_chatbot";

  if (userId && client) {
    const parsed = amirantChatbotRequestSchema.safeParse(raw);
    // The log keeps the redacted request only - never a pasted ID / card / phone number.
    const req = parsed.success ? redactChatRequest(parsed.data) : null;
    // Fire-and-forget insight log: it must never block or fail the answer, so a
    // rejected insert is logged here rather than surfacing as an unhandled rejection.
    void Promise.resolve(
      client.from("amirant_ai_insights").insert({
        user_id: userId,
        insight_kind: "lesson_chat",
        model,
        prompt_version: AI_PROMPT_VERSION,
        input_refs: output.references?.map((r) => ({ chunkId: r.chunkId, lessonId: r.lessonId, topic: r.topic })) ?? [],
        input_payload: { request: req ?? { invalid: true } },
        output_payload: output,
      }),
    )
      .then(({ error }) => {
        if (error) console.warn("[lesson-chat] insight log failed:", error.message);
      })
      .catch((e: unknown) => console.warn("[lesson-chat] insight log failed:", e instanceof Error ? e.message : String(e)));
  }

  return lessonChatResponseSchema.parse(output);
}
