import type { Metadata } from "next";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { SAMPLE_QUESTIONS, SAMPLE_QUESTIONS_INTRO_HE } from "@/lib/prep/marketing/sample-questions";
import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { JsonLdScript, breadcrumbJsonLd, sampleQuestionsQuizJsonLd } from "@/lib/prep/seo/json-ld";
import { PREP_PAGE_META, prepOpenGraph } from "@/lib/prep/seo/page-meta";
import { SampleQuestionList } from "@/components/prep/marketing/SampleQuestionList";
import { ButtonLink, Container, PageLayout } from "@/components/ui";

const siteUrl = getPublicSiteUrl();
const meta = PREP_PAGE_META.sampleQuestions;
const PATH = `${PREP_BASE}/amirant/sample-questions`;

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: ["שאלות לדוגמה אמירנט", "אמירנט דוגמאות", "תרגול אמירנט חינם", "שאלות אמירנט", "amirant sample questions"],
  alternates: { canonical: `${siteUrl}${PATH}` },
  openGraph: prepOpenGraph(siteUrl, { ...meta, path: PATH }),
};

const scored = SAMPLE_QUESTIONS.filter((q) => q.scored).length;
const pilot = SAMPLE_QUESTIONS.length - scored;

/**
 * Ten sample questions, each with its answer behind a disclosure. Static and
 * public: no login, no timer, no grading request - the answers are in the
 * HTML, which is also what the Quiz schema describes.
 */
export default function AmirantSampleQuestionsPage() {
  return (
    <div dir="rtl" className="bg-paper">
      <JsonLdScript
        data={breadcrumbJsonLd(siteUrl, [
          { name: "PREPARE", path: PREP_BASE },
          { name: "הכנה לאמירנט", path: `${PREP_BASE}/amirant` },
          { name: "שאלות לדוגמה", path: PATH },
        ])}
      />
      <JsonLdScript data={sampleQuestionsQuizJsonLd(siteUrl)} />
      <PageLayout pad="lg">
        <Container max="measureWide">
          <Link href={`${PREP_BASE}/amirant`} className="text-sm font-semibold text-primary transition hover:text-primary-hover">
            הכנה לאמירנט
          </Link>
          <h1 className="mt-6 text-[2.2rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.8rem]">
            שאלות לדוגמה מהאמירנט, עם תשובות והסברים
          </h1>
          {SAMPLE_QUESTIONS_INTRO_HE.map((p) => (
            <p key={p.slice(0, 24)} className="mt-4 max-w-[40rem] text-lg leading-relaxed text-muted first-of-type:mt-5">
              {p}
            </p>
          ))}

          <table className="mt-8 w-full max-w-[32rem] border-collapse text-[15px]">
            <caption className="sr-only">מה יש בעמוד</caption>
            <tbody>
              <tr className="border-t border-line">
                <th scope="row" className="py-2 pe-4 text-start font-semibold text-ink">מהפרקים המנוקדים</th>
                <td className="py-2 tabular-nums text-muted">{scored} שאלות: השלמת משפטים, ניסוח מחדש, הבנת הנקרא</td>
              </tr>
              <tr className="border-y border-line">
                <th scope="row" className="py-2 pe-4 text-start font-semibold text-ink">מפרקי הניסוי</th>
                <td className="py-2 tabular-nums text-muted">{pilot} שאלות: הבנת הנשמע, יצירת מילה, דקדוק בהקשר</td>
              </tr>
            </tbody>
          </table>

          <SampleQuestionList questions={SAMPLE_QUESTIONS} />

          <section aria-labelledby="next-steps" className="mt-16 border-t border-line pt-8">
            <h2 id="next-steps" className="text-2xl font-bold text-ink">
              מה הלאה
            </h2>
            <p className="mt-3 max-w-[40rem] text-[16px] leading-relaxed text-muted">
              מבחן הרמה בקורס נותן הערכת רמה משוערת ב-15 שאלות ועשר דקות, בחינם. אחריו מגיעים מדריך השיטות של כל סוג
              שאלה, מבחני התרגול המדורגים והסימולציות המלאות עם טיימר לכל פרק. למי שרוצים לקרוא קודם: המדריכים על{" "}
              <Link href={`${PREP_BASE}/blog/amirant-exam-structure-2026`} className="font-semibold text-primary hover:underline">
                מבנה המבחן
              </Link>
              , על{" "}
              <Link href={`${PREP_BASE}/blog/amirant-passing-score`} className="font-semibold text-primary hover:underline">
                ציון עובר ופטור
              </Link>{" "}
              ועל{" "}
              <Link href={`${PREP_BASE}/blog/how-long-to-prepare-for-amirant`} className="font-semibold text-primary hover:underline">
                כמה זמן להתכונן
              </Link>
              .
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href={`${PREP_BASE}/amirant/course/quiz/quiz-entry-diagnostic`} variant="primary" className="min-h-[3rem] !rounded px-6 text-[15px] font-bold">
                התחלת מבחן הרמה
              </ButtonLink>
              <ButtonLink href={`${PREP_BASE}/pricing`} variant="secondary" className="min-h-[3rem] !rounded !border-primary px-6 text-[15px] !text-primary">
                מחירי הגישה המלאה
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-muted">
              השאלות מתוך מדריכי קורס PREPARE, קורס הכנה עצמאי שאינו קשור למאל״ו. מבנה המבחן לפי פרסומי המרכז הארצי לבחינות
              ולהערכה באתר{" "}
              <a href="https://www.nite.org.il" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                nite.org.il
              </a>
              .
            </p>
          </section>
        </Container>
      </PageLayout>
    </div>
  );
}
