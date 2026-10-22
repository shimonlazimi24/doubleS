import type { Metadata } from "next";
import { PREP_BRAND_WORDMARK } from "@/lib/prep/brand";
import { AMIRANT_COURSE_COUNTS, AMIRANT_PLAN_FACTS } from "@/lib/prep/marketing/amirant-seo-content";

/**
 * Titles and descriptions of the public marketing pages, in one place so a test
 * can hold them to the SERP limits (title <= 60 incl. the " | PREPARE" suffix,
 * description <= 155) and to uniqueness. Page files import from here.
 */

/** Appended by the /prep layout's title template. */
export const TITLE_SUFFIX = ` | ${PREP_BRAND_WORDMARK}`;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export type PrepPageMeta = {
  /** Title without the layout suffix (the home page opts out of the suffix). */
  title: string;
  description: string;
};

const c = AMIRANT_COURSE_COUNTS;
const week = AMIRANT_PLAN_FACTS[0]!;
const month = AMIRANT_PLAN_FACTS[2]!;

export const PREP_PAGE_META = {
  home: {
    title: "PREPARE - הכנה לאמירנט אונליין: קורס מלא ומבחן רמה חינם",
    description:
      `קורס הכנה לאמירנט אונליין בעברית: ${c.lessons} שיעורים, תרגול אדפטיבי, ` +
      `${c.simulations} סימולציות מלאות בטיימר ועוזר AI. מבחן רמה חינם. הציון הרשמי נקבע במבחן מאל״ו.`,
  },
  amirant: {
    title: "הכנה לאמירנט אונליין - קורס מלא ומבחן רמה חינם",
    description:
      `קורס הכנה לאמירנט: ${c.modules} מודולים, ${c.lessons} שיעורים, ${c.simulations} סימולציות מלאות ` +
      `ועוזר AI בעברית. מעודכן לרפורמת 2026. מבחן רמה חינם; גישה מ-${week.priceNis} ₪ לשבוע עד ${month.priceNis} ₪ לחודש.`,
  },
  pricing: {
    title: `מחירי קורס ההכנה לאמירנט: שבוע ${week.priceNis} ₪, חודש ${month.priceNis} ₪`,
    description:
      `גישה מלאה לקורס ההכנה לאמירנט לזמן קצוב: ${AMIRANT_PLAN_FACTS.map((p) => `${p.labelHe} ${p.priceNis} ₪`).join(", ")}. ` +
      "תשלום חד-פעמי, לא מנוי מתחדש. מבוא ומבחן רמה חינם. אין הבטחת ציון או פטור.",
  },
  about: {
    title: "אודות PREPARE - מי מאחורי קורס ההכנה לאמירנט",
    description:
      "PREPARE היא פלטפורמת הכנה דיגיטלית עצמאית לאמירנט: שיעורים מובנים, תרגול אדפטיבי, סימולציות מלאות ועוזר AI בעברית. לא קשורה למאל״ו.",
  },
  courses: {
    title: "קורסי הכנה למבחני אנגלית אקדמיים",
    description: "קטלוג קורסי ההכנה של PREPARE: קורס אמירנט אונליין פעיל, הכנה ל-TOEFL בפיתוח.",
  },
  blog: {
    title: "בלוג - מדריכים להכנה לאמירנט",
    description:
      "מדריכים מעשיים לאמירנט: מבנה המבחן, סולם הציונים ופטור מאנגלית, רפורמת 2026 ואסטרטגיות הכנה.",
  },
  contact: {
    title: "יצירת קשר",
    description: "שאלות על קורס ההכנה לאמירנט, רכישה או תקלה טכנית - כתבו לתמיכה של PREPARE, מענה בתוך יום עסקים.",
  },
  terms: {
    title: "תקנון שימוש",
    description: "תנאי השימוש באתר PREPARE ורכישת גישה לקורס ההכנה לאמירנט: מה נמכר, תשלום, ביטול והחזרים, שימוש הוגן.",
  },
  privacy: {
    title: "מדיניות פרטיות",
    description: "איזה מידע אוסף אתר PREPARE, למה הוא משמש ואיך הוא נשמר: חשבון, נתוני למידה, תשלומים, עוגיות ועוזר ה-AI.",
  },
  accessibility: {
    title: "הצהרת נגישות",
    description:
      "הצהרת הנגישות של אתר PREPARE: התקן שאליו האתר מותאם (ת״י 5568 / WCAG 2.1 AA), מה בוצע, מגבלות ידועות ואיך לפנות לרכז הנגישות.",
  },
  toefl: {
    title: "הכנה ל-TOEFL - בקרוב",
    description: "קורס ההכנה ל-TOEFL iBT של PREPARE בפיתוח. בינתיים קורס ההכנה לאמירנט פתוח ופעיל.",
  },
  login: {
    title: "התחברות",
    description: "התחברות ל-PREPARE עם Google או קוד במייל - שמירת התקדמות וגישה לקורס ההכנה לאמירנט.",
  },
} as const satisfies Record<string, PrepPageMeta>;

export type PrepPageMetaKey = keyof typeof PREP_PAGE_META;

/**
 * OpenGraph block for a page below /prep. The social image is the file
 * convention at src/app/prep/opengraph-image.tsx, but a page that sets its own
 * `openGraph` replaces the inherited object wholesale - so /prep/amirant and
 * every other nested page shipped with no og:image. Spell it out here.
 */
export function prepOpenGraph(
  siteUrl: string,
  page: { title: string; description: string; path: string },
  article?: { publishedTime: string; modifiedTime?: string; section?: string; tags?: readonly string[] },
): NonNullable<Metadata["openGraph"]> {
  return {
    ...(article
      ? {
          type: "article" as const,
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime ?? article.publishedTime,
          section: article.section,
          tags: article.tags ? [...article.tags] : undefined,
        }
      : { type: "website" as const }),
    title: page.title,
    description: page.description,
    url: `${siteUrl}${page.path}`,
    locale: "he_IL",
    siteName: PREP_BRAND_WORDMARK,
    images: [
      {
        url: `${siteUrl}/prep/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "PREPARE - הכנה לאמירנט",
      },
    ],
  };
}
