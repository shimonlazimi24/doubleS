import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAiChatProviderFromEnv,
  getGeminiApiKey,
  getOpenAiApiKey,
  OPENAI_CHAT_MODEL,
  OPENAI_EMBEDDING_MODEL,
  GEMINI_CHAT_MODEL,
  hasAnyChatApiKey,
} from "./ai-config";
import { runEmbedding } from "./openai-client";

export type AiRouteHealthStatus = "ok" | "degraded" | "unavailable";

export type AiSystemHealth = {
  status: "ok" | "degraded" | "unavailable" | "error";
  errorMessage?: string;
  config: {
    selectedProvider: "openai" | "gemini";
    hasOpenAiKey: boolean;
    hasGeminiKey: boolean;
    openAiKeyConfigured: boolean;
    geminiKeyConfigured: boolean;
    chatModelOpenAi: string;
    chatModelGemini: string;
    embeddingModel: string;
  };
  database: {
    serviceRoleAvailable: boolean;
    courseContentChunksTableReadable: boolean;
    chunkCount: number | null;
    embeddingCount: number | null;
  };
  vectorSearch: { works: boolean; error?: string };
  routes: {
    "lesson-chat": AiRouteHealthStatus;
    "quiz-review": AiRouteHealthStatus;
    "recommendations": AiRouteHealthStatus;
    "coach-summary": AiRouteHealthStatus;
  };
};

function routeStatus(params: {
  hasChat: boolean;
  tableOk: boolean;
  chunkCount: number;
  embeddingCount: number;
  vectorWorks: boolean;
}): AiRouteHealthStatus {
  if (!params.hasChat) return "unavailable";
  if (!params.tableOk) return "unavailable";
  if (params.chunkCount === 0 || params.embeddingCount === 0) return "degraded";
  if (!params.vectorWorks) return "degraded";
  return "ok";
}

/**
 * @param service — optional service-role client for RAG stats (bypasses RLS). If null, DB counts are null and table read is false.
 */
export async function getAiSystemHealth(params: { service: SupabaseClient | null }): Promise<AiSystemHealth> {
  const config = {
    selectedProvider: getAiChatProviderFromEnv(),
    hasOpenAiKey: Boolean(getOpenAiApiKey()),
    hasGeminiKey: Boolean(getGeminiApiKey()),
    openAiKeyConfigured: Boolean(getOpenAiApiKey()),
    geminiKeyConfigured: Boolean(getGeminiApiKey()),
    chatModelOpenAi: OPENAI_CHAT_MODEL,
    chatModelGemini: GEMINI_CHAT_MODEL,
    embeddingModel: OPENAI_EMBEDDING_MODEL,
  };

  let serviceRoleAvailable = params.service != null;
  let courseContentChunksTableReadable = false;
  let chunkCount: number | null = null;
  let embeddingCount: number | null = null;
  let vectorError: string | undefined;
  let vectorWorks = false;

  if (params.service) {
    const { count: c, error: cErr } = await params.service
      .from("course_content_chunks")
      .select("*", { count: "exact", head: true })
      .eq("course_slug", "amirant-preparation");
    if (!cErr) {
      courseContentChunksTableReadable = true;
      chunkCount = c ?? 0;
    }
    const { count: e, error: eErr } = await params.service
      .from("course_content_chunks")
      .select("*", { count: "exact", head: true })
      .eq("course_slug", "amirant-preparation")
      .not("embedding", "is", null);
    if (!eErr) {
      embeddingCount = e ?? 0;
    }
    if ((embeddingCount ?? 0) > 0 && getOpenAiApiKey()) {
      try {
        const { embedding } = await runEmbedding({ text: "amirant health check query" });
        if (embedding.length > 0) {
          const { data, error: rpcErr } = await params.service.rpc("match_course_content_chunks", {
            query_embedding: embedding,
            match_count: 3,
            filter_course_slug: "amirant-preparation",
            filter_lesson_id: null,
            filter_topic: null,
          });
          if (!rpcErr && Array.isArray(data)) {
            vectorWorks = true;
          } else {
            vectorError = rpcErr?.message ?? "RPC returned no data";
          }
        }
      } catch (e) {
        vectorError = e instanceof Error ? e.message : String(e);
      }
    } else if ((embeddingCount ?? 0) === 0) {
      vectorError = "No rows with embeddings";
    } else {
      vectorError = "OPENAI_API_KEY required for live vector test";
    }
  }

  const hasChat = hasAnyChatApiKey();
  let routeLevel: AiRouteHealthStatus;
  if (!params.service) {
    routeLevel = hasChat ? "degraded" : "unavailable";
  } else {
    routeLevel = routeStatus({
      hasChat,
      tableOk: courseContentChunksTableReadable,
      chunkCount: chunkCount ?? 0,
      embeddingCount: embeddingCount ?? 0,
      vectorWorks,
    });
  }
  const routes: AiSystemHealth["routes"] = {
    "lesson-chat": routeLevel,
    "quiz-review": routeLevel,
    "recommendations": routeLevel,
    "coach-summary": routeLevel,
  };

  let status: AiSystemHealth["status"] = "ok";
  if (!hasChat) {
    status = "unavailable";
  } else if (!params.service) {
    status = "degraded";
  } else if (!courseContentChunksTableReadable) {
    status = "unavailable";
  } else if (chunkCount === 0 || embeddingCount === 0 || !vectorWorks) {
    status = "degraded";
  }

  return {
    status,
    config,
    database: {
      serviceRoleAvailable,
      courseContentChunksTableReadable,
      chunkCount,
      embeddingCount,
    },
    vectorSearch: { works: vectorWorks, error: vectorError },
    routes,
  };
}
