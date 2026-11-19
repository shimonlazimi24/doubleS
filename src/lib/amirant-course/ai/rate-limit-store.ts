/**
 * Durable rate-limit backend. Order: Upstash Redis REST when configured, then a
 * counter table in the project's own Postgres (prep_rate_limit_hit), then
 * in-memory. Memory alone is per serverless instance, so on its own it barely
 * limits anything in production.
 */

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();

async function upstashIncr(params: {
  key: string;
  windowMs: number;
  maxRequests: number;
}): Promise<boolean | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(params.windowMs / 1000));
  const redisKey = `ai-rl:${params.key}`;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(windowSec), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: unknown[] };
    const count = Number((body.result ?? [])[0]);
    if (!Number.isFinite(count)) return null;
    return count <= params.maxRequests;
  } catch {
    return null;
  }
}

/**
 * One atomic increment in Postgres. Returns null when the function is missing
 * (migration not applied) or the call fails, so the caller falls through.
 */
async function postgresIncr(params: { key: string; windowMs: number; maxRequests: number }): Promise<boolean | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/prep_rate_limit_hit`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_key: params.key,
        p_window_seconds: Math.max(1, Math.ceil(params.windowMs / 1000)),
        p_max: params.maxRequests,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const allowed = (await res.json()) as unknown;
    return typeof allowed === "boolean" ? allowed : null;
  } catch {
    return null;
  }
}

function memoryIncr(params: { key: string; windowMs: number; maxRequests: number }): boolean {
  const now = Date.now();
  const current = memory.get(params.key);
  if (!current || current.resetAt <= now) {
    memory.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return true;
  }
  if (current.count >= params.maxRequests) return false;
  current.count += 1;
  memory.set(params.key, current);
  return true;
}

export async function checkRateLimitBucket(params: {
  key: string;
  windowMs: number;
  maxRequests: number;
}): Promise<boolean> {
  const durable = await upstashIncr(params);
  if (durable !== null) return durable;
  const viaPostgres = await postgresIncr(params);
  if (viaPostgres !== null) return viaPostgres;
  return memoryIncr(params);
}
