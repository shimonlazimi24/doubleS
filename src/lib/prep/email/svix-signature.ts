import { createHmac, timingSafeEqual } from "node:crypto";

/** Resend signs webhooks with Svix: HMAC-SHA256 over `${id}.${timestamp}.${body}`. */
const TOLERANCE_SECONDS = 5 * 60;

export function verifySvixSignature(input: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  body: string;
  nowMs?: number;
}): boolean {
  const { secret, id, timestamp, signature, body } = input;
  if (!id || !timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  const nowSeconds = (input.nowMs ?? Date.now()) / 1000;
  // A captured request replayed later must not be accepted.
  if (Math.abs(nowSeconds - sentAt) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret, "base64");
  if (key.length === 0) return false;
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();

  // The header may carry several space-separated signatures ("v1,<base64>").
  return signature.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
