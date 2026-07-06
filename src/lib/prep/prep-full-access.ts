import { PREP_BASE } from "./constants";

/**
 * Full access / purchase flag (client + server). Opt-in: unset = not purchased for conversion copy.
 * לשימושי המרה/CTA; **עוזר AI** — ראו `getPrepShowCourseAssistant()`.
 *
 * מנוטרל תמיד בפרודקשן: גישה בתשלום נקבעת אך ורק לפי `course_entitlements`
 * (`hasAmirantFullAccess`). הדגל מכובד רק ב־dev מקומי או ב־Vercel preview.
 */
export function getPrepHasFullAccess(): boolean {
  if (typeof process === "undefined") return false;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview"
  ) {
    return false;
  }
  const v = process.env.NEXT_PUBLIC_PREP_HAS_FULL_ACCESS;
  return v === "1" || v === "true";
}

/**
 * עוזר AI בקורס (צ'אט צף + `/api/.../lesson-chat`): מוצג כשיש גישה מלאה, **או** ב־`next dev` — בלי דגל,
 * כדי שלא "ייעלם" בפיתוח. בפרודקשן נשארת דרישת `NEXT_PUBLIC_PREP_HAS_FULL_ACCESS`.
 */
export function getPrepShowCourseAssistant(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;
  return getPrepHasFullAccess();
}

/**
 * When true, primary CTA on NBA card points to upgrade; secondary = recommended action.
 */
export function getPrepConversionPrimaryCtaIsUpgrade(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_PREP_UPGRADE_CTA_FIRST;
  return v === "1" || v === "true";
}

export function getPrepPricingPath(): string {
  return `${PREP_BASE}/pricing`;
}
