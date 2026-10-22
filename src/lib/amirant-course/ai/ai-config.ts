/**
 * Server-side AI configuration. Chat uses `AI_PROVIDER`; embeddings (RAG) use OpenAI when `OPENAI_API_KEY` is set.
 *
 * Switching models needs no code change:
 *   OPENAI_CHAT_MODEL   - chat model on the OpenAI path (default below)
 *   GEMINI_CHAT_MODEL   - chat model on the Gemini failover path
 *   AI_PROVIDER         - "openai" (default) or "gemini": which provider is tried first
 *   AI_CHAT_TIMEOUT_MS  - per-call timeout for chat completions (default 40s)
 */
export type AIChatProvider = "openai" | "gemini";

export function getOpenAiApiKey(): string | null {
  const k = process.env.OPENAI_API_KEY?.trim();
  return k || null;
}

export function getGeminiApiKey(): string | null {
  const k = process.env.GEMINI_API_KEY?.trim();
  return k || null;
}

/**
 * User preference. Actual chat provider may differ if the preferred key is missing (see `resolveChatProvidersToTry`).
 */
export function getAiChatProviderFromEnv(): AIChatProvider {
  const raw = (process.env.AI_PROVIDER ?? "openai").toLowerCase().trim();
  return raw === "gemini" ? "gemini" : "openai";
}

/**
 * OpenAI chat model. `gpt-4.1-mini` is the fastest model in its tier that follows the
 * staged-hint and "no invented exam facts" rules reliably with structured outputs;
 * `gpt-4o-mini` remains a valid cheaper override via `OPENAI_CHAT_MODEL`.
 */
export const DEFAULT_OPENAI_CHAT_MODEL = "gpt-4.1-mini";
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_OPENAI_CHAT_MODEL;

/** Gemini 1.5 is retired; 2.5 Flash is the current fast tier. */
export const DEFAULT_GEMINI_CHAT_MODEL = "gemini-2.5-flash";
export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_GEMINI_CHAT_MODEL;

export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

/**
 * Reasoning-family models (gpt-5*, o*) reject `temperature` and `max_tokens`; the
 * chat client adapts its request shape by this check so an env switch cannot break the route.
 */
export function isOpenAiReasoningModel(model: string): boolean {
  const m = model.trim().toLowerCase();
  return /^(gpt-5|o\d)/.test(m);
}

export function getAiChatTimeoutMs(): number {
  const n = Number(process.env.AI_CHAT_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 5_000 ? Math.min(n, 120_000) : 40_000;
}

/** Embedding is on the critical path to the first token; keep it short and fail open (text fallback). */
export const AI_EMBEDDING_TIMEOUT_MS = 8_000;

/**
 * Order of providers to try for structured chat. Preferred first, then the other if it has a key.
 */
export function resolveChatProvidersToTry(): AIChatProvider[] {
  const prefer = getAiChatProviderFromEnv();
  const o = getOpenAiApiKey();
  const g = getGeminiApiKey();
  const a: AIChatProvider[] = [];
  if (prefer === "openai") {
    if (o) a.push("openai");
    if (g) a.push("gemini");
  } else {
    if (g) a.push("gemini");
    if (o) a.push("openai");
  }
  return a;
}

export function hasAnyChatApiKey(): boolean {
  return Boolean(getOpenAiApiKey() || getGeminiApiKey());
}
