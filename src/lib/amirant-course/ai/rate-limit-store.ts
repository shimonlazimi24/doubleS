/**
 * Durable rate-limit backend (Upstash Redis REST). Falls back to in-memory when unset.
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
  return memoryIncr(params);
}
