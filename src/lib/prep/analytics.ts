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
    fbq?: (command: "track", eventName: string, params?: EventParams, options?: { eventID: string }) => void;
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
    sendWhenReady(gtagQueue, [name, params]);
    const metaName = META_EVENT_NAMES[name];
    if (metaName && process.env.NEXT_PUBLIC_META_PIXEL_ID) sendWhenReady(metaQueue, [metaName, params]);
  } catch {
    /* ignore */
  }
}

/** Funnel events Meta optimises ads on, by its standard event names. */
const META_EVENT_NAMES: Record<string, string> = {
  view_pricing: "ViewContent",
  sign_up: "CompleteRegistration",
  placement_complete: "Lead",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

/**
 * The tags load only after consent and after hydration, so an event fired in a
 * mount effect (purchase on the success page, view_pricing on a direct load)
 * used to hit an undefined function and vanish. Events wait here until the tag
 * is ready, and are dropped if it never arrives.
 */
type PendingEvent = [string, EventParams];
type TagQueue = {
  pending: PendingEvent[];
  timer: number | null;
  /** Sends one event; false when the tag is not on the page yet. */
  send: (event: PendingEvent) => boolean;
};

const TAG_POLL_MS = 250;
const TAG_MAX_POLLS = 60;

const gtagQueue: TagQueue = {
  pending: [],
  timer: null,
  send: ([name, params]) => {
    if (typeof window.gtag !== "function") return false;
    window.gtag("event", name, params);
    return true;
  },
};

const metaQueue: TagQueue = {
  pending: [],
  timer: null,
  send: ([name, params]) => {
    if (typeof window.fbq !== "function") return false;
    // eventID lets Meta de-duplicate a purchase reported more than once.
    const eventId = typeof params.transaction_id === "string" ? params.transaction_id : null;
    if (eventId) window.fbq("track", name, params, { eventID: eventId });
    else window.fbq("track", name, params);
    return true;
  },
};

function flushQueue(queue: TagQueue): boolean {
  while (queue.pending.length > 0) {
    if (!queue.send(queue.pending[0]!)) return false;
    queue.pending.shift();
  }
  return true;
}

function sendWhenReady(queue: TagQueue, event: PendingEvent): void {
  queue.pending.push(event);
  if (flushQueue(queue) || queue.timer !== null) return;
  let polls = 0;
  queue.timer = window.setInterval(() => {
    polls += 1;
    if (flushQueue(queue) || polls >= TAG_MAX_POLLS) {
      if (queue.timer !== null) window.clearInterval(queue.timer);
      queue.timer = null;
      queue.pending.length = 0;
    }
  }, TAG_POLL_MS);
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
