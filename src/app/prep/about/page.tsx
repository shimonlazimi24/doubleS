import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ButtonLink, Container, Heading, Text } from "@/components/ui";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { courseTrustItems } from "@/components/prep/marketing/HeroSection";
import { AMIRANT_PREPARATION_MANIFEST, countManifestLessons } from "@/lib/amirant-course";
import { SUPPORT_EMAIL } from "@/lib/prep/marketing-pages";
import { PREP_BASE } from "@/lib/prep/constants";
import { JsonLdScript, breadcrumbJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.about;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: `${siteUrl}/prep/about` },
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: "/prep/about" }),
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
    step: "1",
    title: "לומדים את סוגי השאלות",
    body: "לא «אנגלית כללית» - לכל סוג שאלה יש שיטת פתרון ומלכודות קבועות.",
  },
  {
    step: "2",
    title: "מתרגלים עם טיימר",
    body: "עם שעון, עם לחץ, עם סימולציות מלאות - תרגול בסגנון יום המבחן.",
  },
  {
    step: "3",
    title: "מנתחים כל טעות",
    body: "הציון עולה כשמבינים למה טעיתם, לא כשפותרים עוד ועוד.",
  },
] as const;


/**
 * The people behind the course. A portrait is shown only when its file exists
 * under public/prep/team at build time, so a missing photo never breaks the page.
 */
const TEAM = [
  { name: "שמעון לזימי", role: "מייסד שותף", photo: "/prep/team/shimon.jpg" },
  { name: "שחר ציגלר", role: "מייסד שותף", photo: "/prep/team/shahar.jpg" },
] as const;

function hasPublicFile(publicPath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", publicPath));
}

export default function PrepAboutPage() {
  return (
    <div className="bg-canvas">
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "אודות", path: `${PREP_BASE}/about` },
        ])}
      />
      {/* ── Hero קומפקטי: קיקר, הצהרת עיקרון, פס נתונים ── */}
      <header className="border-b border-line bg-paper">
        <Container max="readable" className="py-10 md:py-14">
          <Heading level={1} className="max-w-[26ch]">
            מבחן אנגלית הוא מיומנות - ומיומנות מתאמנים עליה
          </Heading>
          <Text as="p" variant="bodyLg" className="mt-4 max-w-[52ch]">
            PREPARE היא פלטפורמת הכנה דיגיטלית לאמירנט - מבחן האנגלית האקדמי הנדרש לקבלה
            למוסדות בישראל. במקום ערימת חומרים בנינו קורס אחד מובנה: שיעורים בסדר ברור,
            תרגול אדפטיבי, סימולציות מלאות ועוזר AI בעברית. ממוקד, מדיד ובלי רעש.
          </Text>
          <TrustIndicators items={courseTrustItems()} className="mt-10" />
        </Container>
      </header>

      {/* ── מה בקורס: שתי עמודות עם שורות קו-שיער - בלי כרטיסים ── */}
      <section className="py-12 md:py-16">
        <Container max="readable">
          <Heading level={2} as="h2" className="text-2xl md:text-3xl">
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
          <Heading level={2} as="h2" className="text-2xl md:text-3xl">
            איך אנחנו עובדים
          </Heading>
          <Text as="p" variant="body" className="mt-2 max-w-[52ch]">
            שלושה עקרונות שחוזרים בכל שיעור, תרגול וסימולציה בקורס.
          </Text>
          <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-3">
            {METHOD_PRINCIPLES.map((p) => (
              <li key={p.step} className="border-t border-line pt-3">
                <h3 className="text-base font-semibold text-ink">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Who is behind the course: names and portraits, no cards. */}
      <section className="border-t border-line py-12 md:py-16">
        <Container max="readable">
          <Heading level={2} as="h2" className="text-2xl md:text-3xl">
            מי מאחורי PREPARE
          </Heading>
          <Text as="p" variant="body" className="mt-2 max-w-[52ch]">
            שני מייסדים, קורס אחד. התוכן נכתב ונבדק אצלנו, והשיטות הן אלה שמופיעות בכל שיעור.
          </Text>
          <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {TEAM.map((person) => {
              const showPhoto = hasPublicFile(person.photo);
              return (
                <li key={person.name} className="border-t border-line pt-5">
                  {showPhoto ? (
                    <Image
                      src={person.photo}
                      alt={person.name}
                      width={480}
                      height={600}
                      sizes="(min-width: 640px) 240px, 60vw"
                      className="h-auto w-40 rounded object-cover sm:w-48"
                    />
                  ) : null}
                  <p className="mt-4 text-lg font-semibold text-ink">{person.name}</p>
                  <p className="text-sm text-muted">{person.role}</p>
                </li>
              );
            })}
          </ul>
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
