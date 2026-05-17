/** prePare — brand tokens (single source of truth). */

export const PREP_BRAND_LATIN = "prePare";
export const PREP_BRAND_NAV_HE = "הכנה למבחני אנגלית";
/** Wordmark in `public/prep/logo.png` */
export const PREP_LOGO_PATH = "/prep/logo.png";
export const PREP_LOGO_WIDTH = 1024;
export const PREP_LOGO_HEIGHT = 576;
export const PREP_BRAND_TAGLINE_HE =
  "מבחנים וקורסים ללימוד אנגלית — ממוקד, מדיד, בלי רעש";

/** @deprecated Use PREP_BRAND_NAV_HE or PREP_BRAND_LATIN */
export const PREP_PRODUCT_NAME = PREP_BRAND_NAV_HE;

export type PrepCourseStatus = "live" | "coming_soon";

export type PrepCourseCatalogItem = {
  id: string;
  examSlug: string;
  title: string;
  shortTitle: string;
  href: string;
  status: PrepCourseStatus;
  imageKey: "amirant" | "toefl";
  priceFromIls: number | null;
  rating: number | null;
  reviewCount: number | null;
};

export const PREP_COURSES: readonly PrepCourseCatalogItem[] = [
  {
    id: "amirant",
    examSlug: "amirant",
    title: "אמירנט: ערכת הכנה אונליין",
    shortTitle: "אמירנט",
    href: "/prep/amirant",
    status: "live",
    imageKey: "amirant",
    priceFromIls: null,
    rating: null,
    reviewCount: null,
  },
  {
    id: "toefl",
    examSlug: "toefl",
    title: "TOEFL: הכנה מקוונת",
    shortTitle: "TOEFL",
    href: "/prep/toefl",
    status: "coming_soon",
    imageKey: "toefl",
    priceFromIls: null,
    rating: null,
    reviewCount: null,
  },
] as const;

export function isGoogleOAuthEnabledInApp(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_PREP_OAUTH_GOOGLE;
  return v === "1" || v === "true";
}
