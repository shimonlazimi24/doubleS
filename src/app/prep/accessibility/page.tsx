import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Text } from "@/components/ui";
import { PREP_BASE, PREP_PRODUCT_NAME } from "@/lib/prep/constants";
import { SUPPORT_EMAIL } from "@/lib/prep/marketing-pages";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.accessibility;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `${siteUrl}/prep/accessibility` },
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: "/prep/accessibility" }),
};

/** Bump when the statement's content changes (the sitemap entry carries the same date). */
const LAST_UPDATED_HE = "אוקטובר 2026";

/**
 * The accessibility coordinator is a named person by law (תקנות שוויון זכויות
 * לאנשים עם מוגבלות, התאמות נגישות לשירות). This placeholder is replaced by the
 * owner - never invent a name here.
 */
const COORDINATOR_NAME = "[שם רכז הנגישות]";

type Section = { heading: string; body?: string; bullets?: string[] };

const SECTIONS: Section[] = [
  {
    heading: "המחויבות שלנו",
    body:
      `${PREP_PRODUCT_NAME} רואה חשיבות רבה במתן שירות שוויוני לכלל הלומדים, ובכלל זה לאנשים עם מוגבלות. ` +
      "אנו פועלים להנגשת האתר וקורס ההכנה לאמירנט כך שיהיו שמישים ונוחים לשימוש בעזרת מקלדת בלבד, קוראי מסך וטכנולוגיות מסייעות אחרות.",
  },
  {
    heading: "התקן שאליו האתר מותאם",
    body:
      "האתר נבנה בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013, " +
      "ולתקן הישראלי ת״י 5568 המבוסס על הנחיות WCAG 2.0 ברמה AA. בפועל אנו שואפים לעמוד בהנחיות WCAG 2.1 ברמה AA.",
  },
  {
    heading: "מה בוצע באתר",
    bullets: [
      "ניווט מלא במקלדת: כל הקישורים, הכפתורים, אפשרויות התשובה בחידונים ועוזר הקורס נגישים בלחיצת Tab, עם סימון פוקוס בולט.",
      "קישור «דילוג לתוכן הראשי» בראש כל עמוד.",
      "מבנה סמנטי: אזור תוכן ראשי אחד, אזורי ניווט עם שמות, כותרות בסדר היררכי.",
      "תוויות ושמות נגישים לכל שדות הטופס ולכפתורי הסמל.",
      "אפשרויות התשובה בחידונים מוצגות כקבוצת בחירה (radio group) עם ניווט בחיצים.",
      "טיימר הבחינה אינו מוקרא כל שנייה; קורא המסך מקבל הודעה חמש דקות ודקה אחת לפני הסיום.",
      "ניגודיות צבעים של לפחות 4.5:1 בין טקסט לרקע.",
      "תוכן באנגלית (שאלות, קטעי קריאה) מסומן בשפה ובכיוון הנכונים לקוראי מסך.",
      "האתר ניתן להגדלה עד 200% בלי גלילה אופקית.",
      "כיבוד הגדרת «הפחתת תנועה» של מערכת ההפעלה.",
      "אזורי מגע בגודל 44 פיקסלים לפחות בטלפון.",
      "בדיקות נגישות אוטומטיות (axe-core) רצות על העמודים הציבוריים ועל מסכי הקורס כחלק מתהליך הפיתוח.",
    ],
  },
  {
    heading: "מגבלות ידועות",
    bullets: [
      "סרטוני ההסבר בקורס עדיין אינם מלווים בכתוביות או בתמלול מלא. אנו עובדים על השלמתם.",
      "עוזר ה-AI מחזיר טקסט חופשי; ייתכן שחלק מהתשובות יכילו עיצוב שאינו מיטבי לקוראי מסך.",
      "חלק מחומרי הלימוד מופיעים כקבצים או תמונות שהגיעו ממקורות חיצוניים, וייתכן שאינם מונגשים במלואם.",
      "האתר נבדק בדפדפנים העדכניים (Chrome, Safari, Firefox, Edge) עם קוראי המסך VoiceOver ו-NVDA; ייתכנו הבדלים בשילובים אחרים.",
    ],
  },
  {
    heading: "דרכי פנייה בנושא נגישות",
    body:
      "נתקלתם בבעיית נגישות באתר או בקורס? נשמח לדעת ולתקן. אנא ציינו את כתובת העמוד, תיאור הבעיה והטכנולוגיה המסייעת שבה השתמשתם. " +
      "אנו משתדלים להשיב לכל פנייה בתוך שלושה ימי עסקים.",
  },
];

export default function PrepAccessibilityPage() {
  return (
    <div className="bg-canvas">
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "הצהרת נגישות", path: `${PREP_BASE}/accessibility` },
        ])}
      />
      <div className="border-b border-line bg-paper">
        <Container max="readable" className="py-10 md:py-14">
          <Link
            href={PREP_BASE}
            className="text-xs font-semibold tracking-[0.14em] text-accent transition hover:text-primary"
          >
            חזרה ל־{PREP_PRODUCT_NAME}
          </Link>
          <Text as="p" variant="labelAccent" className="mt-6 text-accent">
            נגישות
          </Text>
          <Heading level={1} className="mt-2">
            הצהרת נגישות
          </Heading>
          <Text as="p" variant="bodyLg" className="mt-3 max-w-[52ch] text-muted">
            איך אתר {PREP_PRODUCT_NAME} וקורס ההכנה לאמירנט מונגשים, מה עדיין בעבודה, ולמי פונים.
          </Text>
          <Text as="p" variant="caption" className="mt-4">
            עדכון אחרון: {LAST_UPDATED_HE}
          </Text>
        </Container>
      </div>

      <Container max="readable" className="py-10 md:py-14">
        <div className="space-y-9">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="border-t border-line pt-7 text-xl font-bold tracking-tight text-ink md:text-2xl">
                {section.heading}
              </h2>
              {section.body ? (
                <Text as="p" variant="body" className="mt-3 text-ink/90">
                  {section.body}
                </Text>
              ) : null}
              {section.bullets ? (
                <ul className="mt-4 space-y-2.5">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span className="text-base leading-7 text-ink/90">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section>
            <h2 className="border-t border-line pt-7 text-xl font-bold tracking-tight text-ink md:text-2xl">
              רכז הנגישות
            </h2>
            <dl className="mt-4 space-y-2 text-base leading-7 text-ink/90">
              <div className="flex flex-wrap gap-x-3">
                <dt className="font-semibold text-ink">שם:</dt>
                <dd>{COORDINATOR_NAME}</dd>
              </div>
              <div className="flex flex-wrap gap-x-3">
                <dt className="font-semibold text-ink">דוא״ל:</dt>
                <dd>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("פנייה בנושא נגישות")}`}
                    className="font-medium text-accent underline underline-offset-4 transition hover:text-primary"
                    dir="ltr"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
              </div>
            </dl>
            <Text as="p" variant="bodySm" className="mt-4 text-muted">
              הצהרה זו נכתבה בהתאם לתקנות הנגישות ותעודכן עם כל שינוי מהותי באתר.
            </Text>
          </section>
        </div>
      </Container>
    </div>
  );
}
