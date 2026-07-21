import { PREP_BRAND_LATIN, PREP_BRAND_NAV_HE, PREP_LOGO_PATH } from "@/lib/prep/brand";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";

export type JsonLdPrimitive = string | number | boolean | null;
export type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[];
export type JsonLdObject = { [key: string]: JsonLdValue };

export function JsonLdScript({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd(baseUrl: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PREP_BRAND_LATIN,
    url: `${baseUrl}/prep`,
    logo: `${baseUrl}${PREP_LOGO_PATH}`,
    description: `${PREP_BRAND_LATIN}: ${PREP_BRAND_NAV_HE}`,
  };
}

/** Course schema - shown by Google as a course card in search results */
export function amirantCourseJsonLd(baseUrl: string): JsonLdObject {
  const totalLessons = AMIRANT_PREPARATION_MANIFEST.modules.reduce(
    (s, m) => s + m.lessons.length, 0
  );
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "הכנה לאמירנט - קורס דיגיטלי מלא",
    description:
      "קורס הכנה מקיף לאמירנט (מבחן האנגלית האקדמי של מאל״ו). כולל " +
      `${totalLessons} שיעורים, תרגול אדפטיבי עם AI, וסימולציות מלאות בתנאי אמת.`,
    url: `${baseUrl}/prep/amirant`,
    provider: {
      "@type": "Organization",
      name: PREP_BRAND_LATIN,
      url: `${baseUrl}/prep`,
    },
    educationalLevel: "HigherEducation",
    inLanguage: "he",
    courseMode: "online",
    isAccessibleForFree: false,
    offers: [
      { "@type": "Offer", price: "179", priceCurrency: "ILS", name: "גישה לשבוע", category: "Paid" },
      { "@type": "Offer", price: "229", priceCurrency: "ILS", name: "גישה לשבועיים", category: "Paid" },
      { "@type": "Offer", price: "339", priceCurrency: "ILS", name: "גישה לחודש", category: "Paid" },
    ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT15H",
    },
    about: [
      { "@type": "Thing", name: "אמירנט" },
      { "@type": "Thing", name: "מבחן אנגלית אקדמי" },
      { "@type": "Thing", name: "Sentence Completion" },
      { "@type": "Thing", name: "Reading Comprehension" },
    ],
  };
}

/** FAQPage schema - Google shows Q&A directly in search results */
export function amirantFaqJsonLd(): JsonLdObject {
  const faqs = [
    {
      q: "מה זה אמירנט?",
      a: 'אמירנט הוא מבחן אנגלית אקדמי ממוחשב של מאל"ו, הנדרש לקבלה לאוניברסיטאות ומכללות בישראל. המבחן אדפטיבי - רמת השאלות מסתגלת לביצועי הנבחן - והציון נע על סולם של 50-150.',
    },
    {
      q: "כמה שאלות יש באמירנט?",
      a: "23 שאלות מנוקדות ב-6 סגמנטים (39 דקות): 12 שאלות השלמת משפטים (Sentence Completion), 6 שאלות ניסוח מחדש (Restatement) וקטע קריאה עם 5 שאלות (Reading Comprehension). בנוסף 1-2 סגמנטי ניסוי שאינם נספרים בציון.",
    },
    {
      q: "כמה זמן נמשך מבחן האמירנט?",
      a: "כ-50-60 דקות בסך הכול: 39 דקות לסגמנטים המנוקדים ועד 12 דקות נוספות לסגמנטי הניסוי.",
    },
    {
      q: "מה ציון עובר באמירנט?",
      a: "הסולם הוא 50-150 והדרישה משתנה בין מוסדות: 85-99 פותח את דלת הכניסה לאוניברסיטה, 100-119 מקובל ברוב המוסדות, 120-133 פוטר מרוב קורסי האנגלית, ו-134-150 מעניק פטור מלא. בדקו את הדרישה המדויקת מול המוסד שלכם.",
    },
    {
      q: "כמה זמן ללמוד לאמירנט?",
      a: "בממוצע 2-4 שבועות של לימוד מסודר. תלמידים עם בסיס טוב יכולים להתכונן ב-10 ימים; מי שצריך חיזוק משמעותי - 4-6 שבועות.",
    },
    {
      q: "אילו נושאים יש באמירנט?",
      a: "השלמת משפטים (אוצר מילים בהקשר, ~52% מהציון), ניסוח מחדש (~26%) והבנת הנקרא (~22%). מרפורמת אפריל 2026 נוספו גם פרקי ניסוי של Listening ו-Writing שאינם נספרים בציון.",
    },
    {
      q: "האם יש הקראה קולית באמירנט?",
      a: "כן. מרפורמת אפריל 2026 כל נבחן יכול להפעיל תוכנת הקראה (Text-to-Speech) ולשמוע את הטקסטים במבחן - ללא צורך באישור מיוחד.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

/** BreadcrumbList - helps Google show path in search results */
export function breadcrumbJsonLd(
  baseUrl: string,
  crumbs: { name: string; path: string }[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${baseUrl}${c.path}`,
    })),
  };
}
