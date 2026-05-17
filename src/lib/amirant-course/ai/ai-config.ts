/**
 * Server-side AI configuration. Chat uses `AI_PROVIDER`; embeddings (RAG) use OpenAI when `OPENAI_API_KEY` is set.
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

/** OpenAI chat model (cost-efficient default). */
export const OPENAI_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";

export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-1.5-pro";

export const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

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
