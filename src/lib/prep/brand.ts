/** PREPARE - brand tokens (single source of truth). */

/** Typography wordmark (header, marketing) */
export const PREP_BRAND_WORDMARK = "PREPARE";
export const PREP_BRAND_WORDMARK_EN = "Academic Prep";
export const PREP_BRAND_SUBTITLE_HE = "הכנה ללימודים אקדמיים";

/** Legal / metadata */
export const PREP_BRAND_LATIN = "PREPARE";
/** @deprecated Prefer PREP_BRAND_SUBTITLE_HE in marketing surfaces */
export const PREP_BRAND_NAV_HE = "הכנה למבחני אנגלית";
/** Wordmark in `public/prep/logo.png` (favicon / OG only) */
export const PREP_LOGO_PATH = "/prep/logo.png";
export const PREP_LOGO_WIDTH = 1024;
export const PREP_LOGO_HEIGHT = 576;
export const PREP_BRAND_TAGLINE_HE =
  "מבחנים וקורסים ללימוד אנגלית - ממוקד, מדיד, בלי רעש";

/** @deprecated Use PREP_BRAND_NAV_HE or PREP_BRAND_LATIN */
export const PREP_PRODUCT_NAME = PREP_BRAND_NAV_HE;

export type PrepCourseStatus = "live" | "coming_soon";

export type PrepCourseCatalogItem = {
  id: string;
  examSlug: string;
  title: string;
  shortTitle: string;
  blurb: string;
  href: string;
  status: PrepCourseStatus;
  priceFromIls: number | null;
};

export const PREP_COURSES: readonly PrepCourseCatalogItem[] = [
  {
    id: "amirant",
    examSlug: "amirant",
    title: "אמירנט: ערכת הכנה אונליין",
    shortTitle: "אמירנט",
    blurb: "קורס מלא לפטור מאנגלית: שיעורים, תרגול אדפטיבי, סימולציות וליווי AI. מבחן רמה חינם.",
    href: "/prep/amirant",
    status: "live",
    priceFromIls: 179,
  },
  {
    id: "toefl",
    examSlug: "toefl",
    title: "TOEFL: הכנה מקוונת",
    shortTitle: "TOEFL",
    blurb: "הכנה ממוקדת ל-TOEFL iBT - בפיתוח. השאירו פרטים בעמוד הקורס ונעדכן כשנפתח.",
    href: "/prep/toefl",
    status: "coming_soon",
    priceFromIls: null,
  },
] as const;

/** Google sign-in UI - off only with NEXT_PUBLIC_PREP_OAUTH_GOOGLE=0 when Supabase is set. */
export function isGoogleOAuthEnabledInApp(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_PREP_OAUTH_GOOGLE?.trim().toLowerCase();
  if (v === "0" || v === "false") return false;
  if (v === "1" || v === "true") return true;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
}
