import type { SupabaseClient } from "@supabase/supabase-js";
import { runAmirantChatbot } from "./chatbot";
import { AI_PROMPT_VERSION } from "./prompts";
import { amirantChatbotRequestSchema } from "./chatbot/schemas";
import { lessonChatResponseSchema, type LessonChatResponse } from "./schemas";
import type { AiRequestLogContext } from "./ai-request-context";

/**
 * Amirant course assistant: intent routing, RAG, staged hints, performance, vocabulary (see `ai/chatbot/`).
 */
export async function runLessonChatAi(
  client: SupabaseClient,
  userId: string | null,
  raw: unknown,
  logCtx?: AiRequestLogContext,
  onToken?: (delta: string) => void,
): Promise<LessonChatResponse> {
  const output = await runAmirantChatbot(client, userId, raw, logCtx, onToken);
  const model = "amirant_chatbot";

  if (userId) {
    const parsed = amirantChatbotRequestSchema.safeParse(raw);
    const req = parsed.success ? parsed.data : null;
    // Fire-and-forget insight log - don't await so it doesn't block the response
    void client.from("amirant_ai_insights").insert({
      user_id: userId,
      insight_kind: "lesson_chat",
      model,
      prompt_version: AI_PROMPT_VERSION,
      input_refs: output.references?.map((r) => ({ chunkId: r.chunkId, lessonId: r.lessonId, topic: r.topic })) ?? [],
      input_payload: { request: req ?? raw },
      output_payload: output,
    });
  }

  return lessonChatResponseSchema.parse(output);
}
