import type { z } from "zod";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  GEMINI_CHAT_MODEL,
  getGeminiApiKey,
  getOpenAiApiKey,
  OPENAI_CHAT_MODEL,
  resolveChatProvidersToTry,
  type AIChatProvider,
} from "./ai-config";
import { logAiError, logAiFailover, logAiRequest, logAiResponse } from "./ai-logger";
import { buildUsagePayload, logAiUsage } from "./ai-usage";
import { estimateTokenCountFromText } from "./ai-cost";
import { getMaxEstimatedInputTokens, getMaxOutputTokens } from "./ai-usage-env";
import {
  buildStructuredAiCacheKey,
  getFromStructuredCache,
  getPreferredChatModelForCacheKey,
  setStructuredCache,
} from "./ai-cache";

export type StructuredAiResult<T> = {
  output: T;
  model: string;
  effectiveProvider: AIChatProvider;
};

export type RunStructuredAiParams<T> = {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  /** Route / feature for logs (e.g. lesson_chat). */
  operation: string;
  /**
   * When set, responses are deduplicated by short-TTL cache (no PII in key beyond the query string you pass).
   * Do not pass highly sensitive free text if you need to avoid any retention in process memory.
   */
  cacheContext?: { userQuery: string; chunkIds: string[] };
  usageLog?: { userId?: string; sessionId?: string; requestIp?: string };
  skipCache?: boolean;
};

function assertWithinTokenBudget(systemPrompt: string, userPrompt: string): void {
  const est = estimateTokenCountFromText(systemPrompt + userPrompt);
  const max = getMaxEstimatedInputTokens();
  if (est > max) {
    throw new Error(`Estimated input tokens (${est}) exceed limit (${max})`);
  }
}

function logUsageLine(params: {
  operation: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  userId?: string;
  sessionId?: string;
  requestIp?: string;
  cacheHit?: boolean;
}): void {
  const p = buildUsagePayload(params);
  logAiUsage({ event: "ai_usage", ...p });
}

async function runOpenAiStructured<T>(params: {
  schema: z.ZodType<T>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
  operation: string;
  usageLog?: RunStructuredAiParams<T>["usageLog"];
}): Promise<StructuredAiResult<T>> {
  const key = getOpenAiApiKey();
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing");
  }
  assertWithinTokenBudget(params.systemPrompt, params.userPrompt);
  const openai = new OpenAI({ apiKey: key });
  const started = Date.now();
  const promptChars = params.systemPrompt.length + params.userPrompt.length;
  logAiRequest({ operation: params.operation, provider: "openai", promptChars });
  const maxOut = getMaxOutputTokens();

  const completion = await openai.chat.completions.parse({
    model: OPENAI_CHAT_MODEL,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    temperature: 0.2,
    max_tokens: maxOut,
    response_format: zodResponseFormat(params.schema, params.schemaName),
  });

  const output = completion.choices[0]?.message?.parsed;
  if (output == null) {
    throw new Error("Empty OpenAI parsed output");
  }
  const durationMs = Date.now() - started;
  const model = completion.model ?? OPENAI_CHAT_MODEL;
  const outChars = JSON.stringify(output).length;
  logAiResponse({
    operation: params.operation,
    provider: "openai",
    model,
    durationMs,
    outputChars: outChars,
  });
  const u = completion.usage;
  const inputTokens = u?.prompt_tokens ?? estimateTokenCountFromText(params.systemPrompt + params.userPrompt);
  const outputTokens = u?.completion_tokens ?? estimateTokenCountFromText(JSON.stringify(output));
  logUsageLine({
    operation: params.operation,
    provider: "openai",
    model,
    inputTokens,
    outputTokens,
    durationMs,
    userId: params.usageLog?.userId,
    sessionId: params.usageLog?.sessionId,
    requestIp: params.usageLog?.requestIp,
  });
  return { output, model, effectiveProvider: "openai" };
}

async function runGeminiStructured<T>(params: {
  schema: z.ZodType<T>;
  systemPrompt: string;
  userPrompt: string;
  operation: string;
  usageLog?: RunStructuredAiParams<T>["usageLog"];
}): Promise<StructuredAiResult<T>> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("GEMINI_API_KEY is missing");
  }
  assertWithinTokenBudget(params.systemPrompt, params.userPrompt);
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: params.systemPrompt,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      maxOutputTokens: getMaxOutputTokens(),
    },
  });
  const started = Date.now();
  const promptChars = params.systemPrompt.length + params.userPrompt.length;
  logAiRequest({ operation: params.operation, provider: "gemini", promptChars });

  const r = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: params.userPrompt }] }],
  });
  const text = r.response.text();
  if (!text) throw new Error("Empty Gemini output");
  const um = r.response.usageMetadata;
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned non-JSON");
  }
  const parsed = params.schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Gemini schema parse failed: ${parsed.error.message}`);
  }
  const out = parsed.data;
  const durationMs = Date.now() - started;
  logAiResponse({
    operation: params.operation,
    provider: "gemini",
    model: GEMINI_CHAT_MODEL,
    durationMs,
    outputChars: text.length,
  });
  const inputTokens =
    um?.promptTokenCount ?? estimateTokenCountFromText(params.systemPrompt + params.userPrompt);
  const outputTokens =
    um?.candidatesTokenCount ?? estimateTokenCountFromText(text);
  logUsageLine({
    operation: params.operation,
    provider: "gemini",
    model: GEMINI_CHAT_MODEL,
    inputTokens,
    outputTokens,
    durationMs,
    userId: params.usageLog?.userId,
    sessionId: params.usageLog?.sessionId,
    requestIp: params.usageLog?.requestIp,
  });
  return { output: out, model: GEMINI_CHAT_MODEL, effectiveProvider: "gemini" };
}

/**
 * Tries `AI_PROVIDER` first, then the other key if the first call throws (network / quota / parse).
 * Does not invent data — callers keep safety validation on snapshots.
 */
export async function runStructuredAi<T>(params: RunStructuredAiParams<T>): Promise<StructuredAiResult<T>> {
  const order = resolveChatProvidersToTry();
  if (order.length === 0) {
    throw new Error("No AI key configured: set OPENAI_API_KEY and/or GEMINI_API_KEY");
  }

  const modelForKey = getPreferredChatModelForCacheKey();
  const canCache = Boolean(params.cacheContext) && !params.skipCache;
  if (canCache && params.cacheContext) {
    const cacheKey = buildStructuredAiCacheKey({
      operation: params.operation,
      userQuery: params.cacheContext.userQuery,
      chunkIds: params.cacheContext.chunkIds,
      model: modelForKey,
    });
    const hit = getFromStructuredCache<T>(cacheKey);
    if (hit) {
      const durationMs = 0;
      logUsageLine({
        operation: params.operation,
        provider: hit.effectiveProvider,
        model: hit.model,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        userId: params.usageLog?.userId,
        sessionId: params.usageLog?.sessionId,
        requestIp: params.usageLog?.requestIp,
        cacheHit: true,
      });
      return { output: hit.value, model: hit.model, effectiveProvider: hit.effectiveProvider };
    }
  }

  let lastError: Error | null = null;
  for (let i = 0; i < order.length; i++) {
    const p = order[i]!;
    const started = Date.now();
    try {
      let result: StructuredAiResult<T>;
      if (p === "openai") {
        result = await runOpenAiStructured<T>({
          schema: params.schema,
          schemaName: params.schemaName,
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
          operation: params.operation,
          usageLog: params.usageLog,
        });
      } else {
        result = await runGeminiStructured<T>({
          schema: params.schema,
          systemPrompt: params.systemPrompt,
          userPrompt: params.userPrompt,
          operation: params.operation,
          usageLog: params.usageLog,
        });
      }
      if (canCache && params.cacheContext) {
        const cacheKey = buildStructuredAiCacheKey({
          operation: params.operation,
          userQuery: params.cacheContext.userQuery,
          chunkIds: params.cacheContext.chunkIds,
          model: modelForKey,
        });
        setStructuredCache(cacheKey, {
          value: result.output,
          model: result.model,
          effectiveProvider: result.effectiveProvider,
        });
      }
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      lastError = err;
      logAiError({ operation: params.operation, durationMs: Date.now() - started, error: err.message });
      if (i < order.length - 1) {
        logAiFailover({
          operation: params.operation,
          from: p,
          to: order[i + 1]!,
          message: err.message,
        });
      }
    }
  }
  throw lastError ?? new Error("runStructuredAi failed");
}

/**
 * @param provider — if passed, use only that provider (no cross-failover). Useful for tests.
 */
export function createAIClient(provider: AIChatProvider) {
  return {
    provider,
    runStructured: async <T>(p: RunStructuredAiParams<T>): Promise<StructuredAiResult<T>> => {
      if (provider === "openai") {
        return runOpenAiStructured<T>({ ...p, operation: p.operation, usageLog: p.usageLog });
      }
      return runGeminiStructured<T>({ ...p, operation: p.operation, usageLog: p.usageLog });
    },
  };
}
