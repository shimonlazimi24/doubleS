/** הסכמת עוגיות שיווק/מדידה (GA). עוגיות חיוניות (auth/session) תמיד פעילות. */

export const PREP_COOKIE_CONSENT_KEY = "prep_cookie_consent";

export type PrepCookieConsent = "all" | "essential";

export function readPrepCookieConsent(): PrepCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const fromStorage = window.localStorage.getItem(PREP_COOKIE_CONSENT_KEY);
    if (fromStorage === "all" || fromStorage === "essential") return fromStorage;
  } catch {
    /* ignore */
  }
  try {
    const m = document.cookie.match(/(?:^|; )prep_cookie_consent=([^;]*)/);
    const v = m?.[1] ? decodeURIComponent(m[1]) : null;
    if (v === "all" || v === "essential") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writePrepCookieConsent(value: PrepCookieConsent): void {
  try {
    window.localStorage.setItem(PREP_COOKIE_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `prep_cookie_consent=${encodeURIComponent(value)}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function hasPrepMarketingConsent(): boolean {
  return readPrepCookieConsent() === "all";
}
