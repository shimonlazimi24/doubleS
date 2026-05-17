import type { z } from "zod";
import OpenAI from "openai";
import { getOpenAiApiKey, OPENAI_EMBEDDING_MODEL } from "./ai-config";
import { runStructuredAi } from "./create-ai-client";

export { getOpenAiApiKey } from "./ai-config";

/**
 * OpenAI text embeddings for RAG (`match_course_content_chunks`). Always uses `OPENAI_API_KEY`.
 */
export async function runEmbedding(input: {
  text: string;
  model?: string;
}): Promise<{ embedding: number[]; model: string }> {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  const openai = new OpenAI({ apiKey: key });
  const model = input.model ?? OPENAI_EMBEDDING_MODEL;
  const res = await openai.embeddings.create({
    model,
    input: input.text,
  });
  const embedding = res.data[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error("Empty embedding response");
  }
  return { embedding, model: res.model ?? model };
}

/** Same contract as before refactor — delegates to `runStructuredAi`. */
export async function runStructuredOpenAi<T>(params: {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  operation?: string;
  cacheContext?: { userQuery: string; chunkIds: string[] };
  usageLog?: { userId?: string; sessionId?: string; requestIp?: string };
  skipCache?: boolean;
}): Promise<{ output: T; model: string }> {
  const r = await runStructuredAi({
    ...params,
    operation: params.operation ?? params.schemaName,
  });
  return { output: r.output, model: r.model };
}
