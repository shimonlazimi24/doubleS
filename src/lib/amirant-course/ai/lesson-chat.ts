import type { SupabaseClient } from "@supabase/supabase-js";
import { runAmirantChatbot } from "./chatbot";
import { AI_PROMPT_VERSION } from "./prompts";
import { amirantChatbotRequestSchema } from "./chatbot/schemas";
import { lessonChatResponseSchema, type LessonChatResponse } from "./schemas";
import { retrieveCourseChunks, loadAiUserStatsSnapshot, loadAiQuizSnapshot } from "./retrieval";
import type { AiRequestLogContext } from "./ai-request-context";

/**
 * Amirant course assistant: intent routing, RAG, staged hints, performance, vocabulary (see `ai/chatbot/`).
 */
export async function runLessonChatAi(
  client: SupabaseClient,
  userId: string | null,
  raw: unknown,
  logCtx?: AiRequestLogContext,
): Promise<LessonChatResponse> {
  const output = await runAmirantChatbot(client, userId, raw, logCtx);
  const model = "amirant_chatbot";

  if (userId) {
    const parsed = amirantChatbotRequestSchema.safeParse(raw);
    const req = parsed.success ? parsed.data : { userMessage: "", lessonId: undefined as string | undefined, topic: undefined as string | undefined };
    const questionContext = req.lessonId
      ? `Amirant preparation — focus on lesson ${req.lessonId}${req.topic ? `, topic ${req.topic}` : ""}.`
      : `Amirant preparation — course-wide; match chunks to the student message.${
          req.topic ? ` topic filter: ${req.topic}.` : ""
        }`;
    const baseRetrieval = {
      query: req.userMessage,
      questionContext,
      lessonId: req.lessonId,
      operation: "lesson_chat" as const,
    };
    let chunks = await retrieveCourseChunks(client, { ...baseRetrieval, topic: req.topic });
    if (chunks.length === 0 && req.topic) {
      chunks = await retrieveCourseChunks(client, { ...baseRetrieval, topic: undefined });
    }
    if (chunks.length === 0 && req.lessonId) {
      chunks = await retrieveCourseChunks(client, { ...baseRetrieval, lessonId: undefined, topic: req.topic });
    }
    if (chunks.length === 0 && req.lessonId && req.topic) {
      chunks = await retrieveCourseChunks(client, { ...baseRetrieval, lessonId: undefined, topic: undefined });
    }
    const [userStats, quizSnapshot] = await Promise.all([
      loadAiUserStatsSnapshot(client, userId),
      loadAiQuizSnapshot(client, userId),
    ]);
    await client.from("amirant_ai_insights").insert({
      user_id: userId,
      insight_kind: "lesson_chat",
      model,
      prompt_version: AI_PROMPT_VERSION,
      input_refs: chunks.map((c) => ({
        chunkId: c.id,
        lessonId: c.lessonId,
        topic: c.topic,
        similarity: c.similarity,
      })),
      input_payload: { request: raw, userStats, quizSnapshot },
      output_payload: output,
    });
  }

  return lessonChatResponseSchema.parse(output);
}
