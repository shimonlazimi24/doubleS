import { checkRateLimitBucket } from "./rate-limit-store";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

export async function checkAiRateLimit(userId: string): Promise<boolean> {
  return checkAiRouteRateLimit({
    key: userId,
    route: "default",
  });
}

export async function checkAiRouteRateLimit(params: {
  key: string;
  route: string;
  windowMs?: number;
  maxRequests?: number;
}): Promise<boolean> {
  const windowMs = params.windowMs ?? WINDOW_MS;
  const maxRequests = params.maxRequests ?? MAX_REQUESTS_PER_WINDOW;
  const bucketKey = `${params.route}:${params.key}`;
  return checkRateLimitBucket({ key: bucketKey, windowMs, maxRequests });
}

/** Require both the user and IP to be under their respective buckets. */
export async function checkAiUserAndIpRateLimit(params: {
  userId: string;
  ip: string;
  route: string;
  windowMs?: number;
  maxRequests?: number;
}): Promise<boolean> {
  const [okUser, okIp] = await Promise.all([
    checkAiRouteRateLimit({
      key: `u:${params.userId}`,
      route: params.route,
      windowMs: params.windowMs,
      maxRequests: params.maxRequests,
    }),
    checkAiRouteRateLimit({
      key: `i:${params.ip}`,
      route: params.route,
      windowMs: params.windowMs,
      maxRequests: params.maxRequests,
    }),
  ]);
  return okUser && okIp;
}
