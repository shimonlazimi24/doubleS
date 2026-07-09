import type { PrepMarketingSlug } from "@/lib/prep/constants";

export const PREP_MARKETING_TITLES: Record<PrepMarketingSlug, string> = {
  toefl: "TOEFL",
  amirant: "אמירנט",
  pricing: "מחירים",
  blog: "בלוג",
  about: "אודות",
  contact: "יצירת קשר",
  privacy: "מדיניות פרטיות",
  login: "התחברות",
};

export const SUPPORT_EMAIL = "support@getprepared.academy";

export type MarketingPageSection = {
  heading?: string;
  body?: string;
  bullets?: string[];
};

export type MarketingPageContent = {
  eyebrow: string;
  lede: string;
  sections: MarketingPageSection[];
  /** פס הנתונים (78 שיעורים / כ-300 שאלות / 6 סימולציות / AI) — עמוד אודות */
  stats?: boolean;
  /** כרטיס יצירת קשר עם כפתור mailto */
  contactCard?: boolean;
  /** privacy: תאריך עדכון אחרון */
  lastUpdated?: string;
};

/** תוכן מובנה לעמודי השיווק — מרונדר ב-src/app/prep/[slug]/page.tsx. */
export const PREP_MARKETING_PAGES: Partial<Record<PrepMarketingSlug, MarketingPageContent>> = {
  about: {
    eyebrow: "מי אנחנו",
    lede: "PREPARE נבנתה סביב עיקרון אחד: מבחן אנגלית הוא מיומנות — ומיומנות מתאמנים עליה.",
    sections: [
      {
        heading: "מה בקורס ההכנה לאמירנט",
        bullets: [
          "עשרות שיעורים מובנים — מהיסודות ועד אסטרטגיות פתרון מתקדמות",
          "מאות שאלות תרגול אינטראקטיביות, עם הסבר מלא על כל תשובה",
          "סימולציות מלאות בתנאי אמת, עם טיימר לכל פרק",
          "מבחן רמה חינמי עם ציון משוער בסולם 50–150",
          "עוזר AI אישי בכל שיעור — רמזים, הסברים בעברית והמלצות המשך",
        ],
      },
      {
        heading: "עדכני לפורמט המבחן",
        body: "התוכן נבנה על בסיס הפורמט העדכני של האמירנט — כולל רפורמת 2026 — ומתעדכן באופן שוטף כשהמבחן משתנה.",
      },
    ],
    stats: true,
    contactCard: true,
  },

  contact: {
    eyebrow: "אנחנו כאן",
    lede: "נשמח לעזור בכל שאלה — טכנית, לימודית או בנושא רכישה.",
    sections: [
      {
        heading: "לפני שכותבים",
        bullets: [
          "אנחנו משתדלים לענות לכל פנייה בתוך יום עסקים",
          "בפניות בנושא תשלום — צרפו את מספר ההזמנה מדף אישור הרכישה",
          "שאלות על תוכן הקורס? עוזר ה-AI בתוך השיעורים עונה מיד",
        ],
      },
    ],
    contactCard: true,
  },

  privacy: {
    eyebrow: "שקיפות",
    lede: "מדיניות זו מסבירה איזה מידע נאסף באתר PREPARE (getprepared.academy), למה הוא משמש ואיך הוא נשמר.",
    lastUpdated: "יולי 2026",
    sections: [
      {
        heading: "איזה מידע אנחנו אוספים",
        bullets: [
          "פרטי חשבון — כתובת דוא\"ל ושם (אם סופק), לצורך התחברות",
          "נתוני למידה — התקדמות בשיעורים, תשובות ותוצאות תרגול, לצורך התאמה אישית של הקורס",
          "נתוני רכישה — תוכנית, סכום ומזהה עסקה, לצורך מתן הגישה שנרכשה",
          "נתוני שימוש אנונימיים (אנליטיקס) — לשיפור המוצר",
        ],
      },
      {
        heading: "תשלומים",
        body: "הסליקה מתבצעת במלואה על ידי חברת הסליקה Hyp בדף תשלום מאובטח בתקן PCI-DSS. פרטי כרטיס האשראי אינם נשמרים ואינם עוברים בשרתי האתר בשום שלב.",
      },
      {
        heading: "שימוש בעוזר ה-AI",
        body: "שאלות שנשלחות לעוזר האישי מעובדות על ידי ספקי בינה מלאכותית לצורך מתן המענה בלבד, ואינן משמשות לאימון מודלים.",
      },
      {
        heading: "שיתוף מידע",
        body: "איננו מוכרים או משכירים מידע אישי לצדדים שלישיים. מידע מועבר רק לספקי תשתית החיוניים להפעלת השירות (אחסון, סליקה, אנליטיקס) ובכפוף להתחייבויות סודיות.",
      },
      {
        heading: "אבטחה",
        body: "המידע נשמר במערכות מאובטחות עם בקרות גישה, והתקשורת לאתר מוצפנת (HTTPS).",
      },
      {
        heading: "הזכויות שלכם",
        body: `ניתן לבקש עיון, תיקון או מחיקה של המידע האישי שלכם בכל עת בפנייה ל-${SUPPORT_EMAIL}.`,
      },
    ],
    contactCard: true,
  },
};

const FALLBACK_INTROS: Partial<Record<PrepMarketingSlug, string>> = {
  login: "מעבר לעמוד ההתחברות…",
  amirant: "עמוד אמירנט הראשי מוביל ישירות לקורס ההכנה המלא.",
  toefl: "קורס ההכנה ל-TOEFL בפיתוח — בקרוב. בינתיים, קורס ההכנה לאמירנט פתוח ופעיל.",
  blog: "מאמרים, טיפים ועדכונים על מבחן האמירנט — בקרוב.",
};

/** גוף פשוט לסלאגים בלי תוכן מובנה (toefl/blog). */
export function getPrepMarketingPageBody(slug: PrepMarketingSlug, productName: string): string {
  return FALLBACK_INTROS[slug] ?? `${productName} — התוכן לעמוד זה יתפרסם בקרוב.`;
}
