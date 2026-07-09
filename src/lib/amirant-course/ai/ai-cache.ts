import { createHash } from "node:crypto";
import { AI_PROMPT_VERSION } from "./prompts";
import { OPENAI_CHAT_MODEL, GEMINI_CHAT_MODEL, getAiChatProviderFromEnv, type AIChatProvider } from "./ai-config";

type CacheEntry<T> = { value: T; model: string; effectiveProvider: AIChatProvider; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000;

export function getAiResponseCacheTtlMs(): number {
  const raw = process.env.AI_CACHE_TTL_MS?.trim();
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10 * 60_000) : DEFAULT_TTL_MS;
}

/**
 * @param modelHint - first-try chat model (matches resolve order) for the cache key.
 */
export function buildStructuredAiCacheKey(params: {
  operation: string;
  userQuery: string;
  chunkIds: string[];
  model: string;
}): string {
  const sortedChunks = [...params.chunkIds].sort();
  const payload = JSON.stringify({
    v: AI_PROMPT_VERSION,
    operation: params.operation,
    userQuery: params.userQuery,
    chunkIds: sortedChunks,
    model: params.model,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/** Model name used in cache key for the preferred provider (first in failover order). */
export function getPreferredChatModelForCacheKey(): string {
  return getAiChatProviderFromEnv() === "gemini" ? GEMINI_CHAT_MODEL : OPENAI_CHAT_MODEL;
}

export function getFromStructuredCache<T>(key: string): CacheEntry<T> | null {
  const row = store.get(key) as CacheEntry<T> | undefined;
  if (!row) return null;
  if (Date.now() >= row.expiresAt) {
    store.delete(key);
    return null;
  }
  return row;
}

export function setStructuredCache<T>(key: string, data: { value: T; model: string; effectiveProvider: AIChatProvider }): void {
  const ttl = getAiResponseCacheTtlMs();
  store.set(key, { ...data, expiresAt: Date.now() + ttl });
}

export function _clearStructuredCacheForTests(): void {
  store.clear();
}
