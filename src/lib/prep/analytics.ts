"use client";

/**
 * מעקב המרות - עוטף GA4 (gtag) + Vercel Analytics בקריאה אחת.
 * אירועי המשפך: view_pricing → select_plan → begin_checkout → purchase / checkout_failed.
 * GA נשלח רק אחרי הסכמת מדידה (`prep_cookie_consent=all`).
 */
import { track as vercelTrack } from "@vercel/analytics";
import { hasPrepMarketingConsent } from "@/lib/prep/cookie-consent";

type EventParams = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: EventParams) => void;
  }
}

export function trackEvent(name: string, params: EventParams = {}): void {
  try {
    vercelTrack(name, params);
  } catch {
    /* analytics לא חוסם UX */
  }
  if (!hasPrepMarketingConsent()) return;
  try {
    sendToGtag(name, params);
  } catch {
    /* ignore */
  }
}

/**
 * GA loads only after consent and after hydration, so an event fired in a mount
 * effect (purchase on the success page, view_pricing on a direct load) used to
 * hit an undefined `gtag` and vanish. Events wait here until the tag is ready.
 */
const pendingGtagEvents: Array<[string, EventParams]> = [];
let gtagFlushTimer: number | null = null;
const GTAG_POLL_MS = 250;
const GTAG_MAX_POLLS = 60;

function flushGtagEvents(): boolean {
  if (typeof window.gtag !== "function") return false;
  while (pendingGtagEvents.length > 0) {
    const [eventName, eventParams] = pendingGtagEvents.shift()!;
    window.gtag("event", eventName, eventParams);
  }
  return true;
}

function sendToGtag(name: string, params: EventParams): void {
  pendingGtagEvents.push([name, params]);
  if (flushGtagEvents() || gtagFlushTimer !== null) return;
  let polls = 0;
  gtagFlushTimer = window.setInterval(() => {
    polls += 1;
    if (flushGtagEvents() || polls >= GTAG_MAX_POLLS) {
      if (gtagFlushTimer !== null) window.clearInterval(gtagFlushTimer);
      gtagFlushTimer = null;
      pendingGtagEvents.length = 0;
    }
  }, GTAG_POLL_MS);
}

/** GA4's recommended names: sign_up for an account created in this flow, login otherwise. */
export function trackAuthEvent(user: { created_at?: string; app_metadata?: { provider?: string } }): void {
  const createdMs = Date.parse(user.created_at ?? "");
  const isNew = Number.isFinite(createdMs) && Date.now() - createdMs < 5 * 60_000;
  trackEvent(isNew ? "sign_up" : "login", { method: user.app_metadata?.provider ?? "unknown" });
}

const UTM_COOKIE = "prep_utm";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** לוכד פרמטרי utm_* מה-URL לעוגייה (30 יום) - לשיוך רכישות לקמפיינים. */
export function captureUtmParams(search: string): void {
  try {
    const params = new URLSearchParams(search);
    const utm: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = params.get(key);
      if (v) utm[key] = v.slice(0, 120);
    }
    if (Object.keys(utm).length === 0) return;
    document.cookie = `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(utm))}; path=/; max-age=${30 * 24 * 3600}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function readUtmParams(): Record<string, string> | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${UTM_COOKIE}=([^;]*)`));
    if (!m) return null;
    const parsed = JSON.parse(decodeURIComponent(m[1]!)) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
