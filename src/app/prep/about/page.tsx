import type { Metadata } from "next";
import { ButtonLink, Container, Heading, Text } from "@/components/ui";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { AMIRANT_PREPARATION_MANIFEST, countManifestLessons } from "@/lib/amirant-course";
import { MARKETING_HERO } from "@/lib/prep/marketing/content";
import { SUPPORT_EMAIL } from "@/lib/prep/marketing-pages";
import { PREP_BASE } from "@/lib/prep/constants";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: "אודות",
  description:
    "PREPARE היא פלטפורמת הכנה דיגיטלית לאמירנט: שיעורים מובנים, תרגול אדפטיבי, סימולציות מלאות ועוזר AI בעברית.",
  alternates: { canonical: `${siteUrl}/prep/about` },
};

/** מה בקורס - עובדות בלבד, מיושרות ל-llms.txt ולתוכן השיווקי. */
const lessonCount = countManifestLessons(AMIRANT_PREPARATION_MANIFEST);
const simCount = AMIRANT_PREPARATION_MANIFEST.simulations.length;

const COURSE_FEATURES = [
  {
    lead: "שיעורים מובנים",
    detail: `${lessonCount} שיעורים מהיסודות ועד אסטרטגיות פתרון מתקדמות, בסדר לימוד מומלץ.`,
  },
  {
    lead: "תרגול אדפטיבי",
    detail: "יותר מ־500 שאלות עם הסבר על התשובה - רמת הקושי מסתגלת לביצועים שלכם.",
  },
  {
    lead: "סימולציות מלאות",
    detail: `${simCount} מבחנים מלאים עם טיימר לכל פרק, לתרגול בסגנון אמירנט.`,
  },
  {
    lead: "מבחן רמה חינם",
    detail: "הערכת רמה משוערת (מיפוי מאחוז) — לא ציון אמירנט רשמי.",
  },
  {
    lead: "עוזר AI בעברית",
    detail: "רמזים, הסברים והמלצות המשך - בהקשר של השיעור, לא צ'אט כללי.",
  },
  {
    lead: "עדכני לפורמט המבחן",
    detail: "נבנה על הפורמט העדכני של האמירנט, כולל רפורמת 2026, ומתעדכן כשהמבחן משתנה.",
  },
] as const;

/** שלושת עקרונות השיטה - מנוסחים גם במדריך «ציון עובר באמירנט» בבלוג. */
const METHOD_PRINCIPLES = [
  {
    step: "01",
    title: "לומדים את סוגי השאלות",
    body: "לא «אנגלית כללית» - לכל סוג שאלה יש שיטת פתרון ומלכודות קבועות.",
  },
  {
    step: "02",
    title: "מתרגלים עם טיימר",
    body: "עם שעון, עם לחץ, עם סימולציות מלאות - תרגול בסגנון יום המבחן.",
  },
  {
    step: "03",
    title: "מנתחים כל טעות",
    body: "הציון עולה כשמבינים למה טעיתם, לא כשפותרים עוד ועוד.",
  },
] as const;

export default function PrepAboutPage() {
  return (
    <div className="bg-canvas">
      {/* ── Hero קומפקטי: קיקר, הצהרת עיקרון, פס נתונים ── */}
      <header className="border-b border-line bg-paper">
        <Container max="readable" className="py-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">מי אנחנו</p>
          <Heading level={1} className="mt-3 max-w-[26ch]">
            מבחן אנגלית הוא מיומנות - ומיומנות מתאמנים עליה
          </Heading>
          <Text as="p" variant="bodyLg" className="mt-4 max-w-[52ch]">
            PREPARE היא פלטפורמת הכנה דיגיטלית לאמירנט - מבחן האנגלית האקדמי הנדרש לקבלה
            למוסדות בישראל. במקום ערימת חומרים בנינו קורס אחד מובנה: שיעורים בסדר ברור,
            תרגול אדפטיבי, סימולציות מלאות ועוזר AI בעברית. ממוקד, מדיד ובלי רעש.
          </Text>
          <TrustIndicators items={MARKETING_HERO.trust} className="mt-10" />
        </Container>
      </header>

      {/* ── מה בקורס: שתי עמודות עם שורות קו-שיער - בלי כרטיסים ── */}
      <section className="py-12 md:py-16">
        <Container max="readable">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">התוכנית</p>
          <Heading level={2} as="h2" className="mt-2 text-2xl md:text-3xl">
            מה בקורס ההכנה לאמירנט
          </Heading>
          <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {COURSE_FEATURES.map((f) => (
              <li key={f.lead} className="border-t border-line/70 py-3.5">
                <p className="text-base leading-relaxed text-ink">
                  <span className="font-semibold">{f.lead}.</span>{" "}
                  <span className="text-muted">{f.detail}</span>
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ── השיטה: שלושה עקרונות ממוספרים על קו - לא קופסאות ── */}
      <section className="border-t border-line bg-paper py-12 md:py-16">
        <Container max="readable">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">השיטה</p>
          <Heading level={2} as="h2" className="mt-2 text-2xl md:text-3xl">
            איך אנחנו עובדים
          </Heading>
          <Text as="p" variant="body" className="mt-2 max-w-[52ch]">
            שלושה עקרונות שחוזרים בכל שיעור, תרגול וסימולציה בקורס.
          </Text>
          <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {METHOD_PRINCIPLES.map((p) => (
              <li key={p.step} className="border-t-2 border-primary/15 pt-3">
                <span className="font-mono text-sm font-semibold tabular-nums text-accent">
                  {p.step}
                </span>
                <h3 className="mt-1.5 text-base font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ── סוגר: הזמנה להתחיל + דרך ליצור קשר ── */}
      <section className="border-t border-line py-12 md:py-16">
        <Container max="readable" className="text-center">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-primary md:text-3xl">
              הדרך הטובה ביותר להכיר אותנו - להתחיל ללמוד
            </h2>
            <p className="text-base leading-relaxed text-muted">
              מודול המבוא ומבחן הרמה פתוחים חינם, בלי התחייבות.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <ButtonLink href={`${PREP_BASE}/amirant`} variant="primary" className="shadow-cta">
                לקורס ההכנה לאמירנט
              </ButtonLink>
              <ButtonLink href={`${PREP_BASE}/pricing`} variant="secondary">
                לצפייה במחירים
              </ButtonLink>
            </div>
            <p className="pt-2 text-sm text-muted-2">
              יש שאלה לפני שמתחילים?{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-accent transition hover:text-primary"
                dir="ltr"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}
