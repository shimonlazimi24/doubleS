/**
 * Transactional email through Resend's HTTP API (no SDK dependency).
 * Everything here is optional: without RESEND_API_KEY the helpers report
 * "not configured" and the caller carries on.
 */
const RESEND_API = "https://api.resend.com";
const DEFAULT_FROM = "PREPARE <noreply@getprepared.academy>";
const REQUEST_TIMEOUT_MS = 8_000;

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  from?: string;
};

export type SendEmailResult = { ok: true } | { ok: false; reason: string };

function apiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function isEmailConfigured(): boolean {
  return apiKey() !== null;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = apiKey();
  if (!key) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: input.from ?? DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.name : "unknown" };
  }
}

export type ReceivedEmail = {
  from: string;
  subject: string | null;
  html: string | null;
  text: string | null;
  to: string[];
};

/** Reads an inbound email. Needs an API key with full access, not sending-only. */
export async function getReceivedEmail(emailId: string): Promise<ReceivedEmail | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const res = await fetch(`${RESEND_API}/emails/receiving/${encodeURIComponent(emailId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<ReceivedEmail>;
    if (typeof body.from !== "string") return null;
    return {
      from: body.from,
      subject: typeof body.subject === "string" ? body.subject : null,
      html: typeof body.html === "string" ? body.html : null,
      text: typeof body.text === "string" ? body.text : null,
      to: Array.isArray(body.to) ? body.to.filter((t): t is string => typeof t === "string") : [],
    };
  } catch {
    return null;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
