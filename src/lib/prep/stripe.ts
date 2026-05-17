import { createHmac, timingSafeEqual } from "node:crypto";
import { AMIRANT_PREPARATION_SLUG } from "@/lib/amirant-course/constants";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export function isStripeCheckoutConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_AMIRANT_PRICE_ID?.trim() &&
      process.env.NEXT_PUBLIC_APP_URL?.trim(),
  );
}

export async function createAmirantCheckoutSession(params: {
  userId: string;
  email?: string | null;
}): Promise<{ url: string; sessionId: string }> {
  const secret = requireEnv("STRIPE_SECRET_KEY");
  const priceId = requireEnv("STRIPE_AMIRANT_PRICE_ID");
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");

  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${appUrl}/prep/amirant/course?checkout=success`,
    cancel_url: `${appUrl}/prep/pricing?checkout=cancel`,
    client_reference_id: params.userId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[user_id]": params.userId,
    "metadata[course_slug]": AMIRANT_PREPARATION_SLUG,
  });
  if (params.email) body.set("customer_email", params.email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const json = (await res.json()) as { url?: string; id?: string; error?: { message?: string } };
  if (!res.ok || !json.url || !json.id) {
    throw new Error(json.error?.message ?? "Stripe checkout session failed");
  }
  return { url: json.url, sessionId: json.id };
}

export function verifyStripeWebhookSignature(params: {
  payload: string;
  signatureHeader: string | null;
}): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !params.signatureHeader) return false;

  const parts = params.signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const signed = `${timestamp}.${params.payload}`;
  const expected = createHmac("sha256", secret).update(signed, "utf8").digest("hex");
  try {
    return timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
  } catch {
    return false;
  }
}
