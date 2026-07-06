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

/** Course schema — shown by Google as a course card in search results */
export function amirantCourseJsonLd(baseUrl: string): JsonLdObject {
  const totalLessons = AMIRANT_PREPARATION_MANIFEST.modules.reduce(
    (s, m) => s + m.lessons.length, 0
  );
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "הכנה לאמירנט — קורס דיגיטלי מלא",
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

/** FAQPage schema — Google shows Q&A directly in search results */
export function amirantFaqJsonLd(): JsonLdObject {
  const faqs = [
    {
      q: "מה זה אמירנט?",
      a: 'אמירנט (מאל"ו) הוא מבחן אנגלית אקדמי הנדרש לקבלה לאוניברסיטאות בישראל. המבחן כולל Sentence Completion, Restatement וקטעי קריאה. ציון עובר הוא 85 מתוך 100.',
    },
    {
      q: "כמה שאלות יש באמירנט?",
      a: "המבחן המלא כולל 54 שאלות: 12 Sentence Completion, 12 Restatement ו-30 שאלות Reading Comprehension. בנוסף יש פרק פיילוט שאינו נספר בציון.",
    },
    {
      q: "כמה זמן יש במבחן האמירנט?",
      a: "זמן המבחן הוא כ-70 דקות, מחולק לשלושה פרקים עם זמן קצוב לכל פרק.",
    },
    {
      q: "מה ציון עובר באמירנט?",
      a: 'ציון עובר הוא 85 מתוך 100. חלק מהמוסדות דורשים 95 ואף 100 לתכניות ספציפיות. מומלץ לשאוף ל-95+.',
    },
    {
      q: "כמה זמן ללמוד לאמירנט?",
      a: "בממוצע 2-4 שבועות של לימוד מסודר. תלמידים עם בסיס טוב יכולים להכין ב-10 ימים; מי שצריך חיזוק משמעותי — 4-6 שבועות.",
    },
    {
      q: "אילו נושאים יש באמירנט?",
      a: "האמירנט בוחן: Sentence Completion (השלמת משפטים עם אוצר מילים), Restatement (ניסוח מחדש), ו-Reading Comprehension (קריאה והבנה). מ-2026 נוסף פרק Listening.",
    },
    {
      q: "האם אפשר לגשת לאמירנט יותר מפעם אחת?",
      a: "כן, ניתן לגשת שלוש פעמים לאמירנט. הציון הטוב ביותר הוא שנשמר. מומלץ להתכונן היטב לפני הגשה ראשונה.",
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

/** BreadcrumbList — helps Google show path in search results */
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
