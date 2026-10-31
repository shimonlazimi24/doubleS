import Link from "next/link";
import { ButtonLink, Container } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";
import { COURSE_PATH_STEPS } from "@/lib/prep/marketing/course-path";
import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { MarketingHero } from "@/components/prep/marketing/HeroSection";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { ScoreBandsTable } from "@/components/prep/marketing/ScoreBandsTable";
import { CoursePathSteps } from "@/components/prep/marketing/CoursePathSteps";
import { CourseSyllabusTable } from "@/components/prep/marketing/CourseSyllabusTable";
import { ExamStructureTable } from "@/components/prep/marketing/ExamStructureCards";
import { PlansTable } from "@/components/prep/marketing/PlansTable";
import { AIValueSection } from "@/components/prep/marketing/AIValueSection";
import { FaqList } from "@/components/prep/marketing/FaqList";
import { Reveal } from "@/components/prep/marketing/motion/Reveal";
import { AMIRANT_FAQ, AMIRANT_REFORM_SECTION, AMIRANT_WHO_FOR_SECTION } from "@/lib/prep/marketing/amirant-seo-content";

const COURSE = `${PREP_BASE}/amirant/course`;

function ProseSection({ s, tone }: { s: typeof AMIRANT_WHO_FOR_SECTION; tone: "paper" | "low" }) {
  return (
    <MarketingSection id={s.id} eyebrow={s.eyebrowHe} title={s.headingHe} tone={tone}>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
        <Reveal from="start" className="max-w-[38rem]">
          {s.paragraphsHe.map((p) => (
            <p key={p.slice(0, 40)} className="mb-5 text-[17px] leading-relaxed text-muted last:mb-0">
              {p}
            </p>
          ))}
        </Reveal>
        {s.bulletsHe?.length ? (
          <Reveal from="end" delay={120}>
            <ul className="space-y-3">
              {s.bulletsHe.map((b) => (
                <li key={b} className="flex gap-3 text-[16px] leading-relaxed text-ink">
                  <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </MarketingSection>
  );
}

/**
 * The Amirant course page for visitors: the real course under a navy shade,
 * what the exam is worth, what the course contains, what it costs.
 */
export function PrepAmirantHub() {
  return (
    <div dir="rtl" className="bg-paper">
      <MarketingHero
        copy={{
          eyebrow: "קורס הכנה לאמירנט",
          headline: "להגיע לפטור, או קרוב אליו, בלי קורסי השלמה מיותרים",
          subheadline:
            "שיעורי שיטה, יחידות תרגול מדורגות לכל חלק במבחן, סימולציות מלאות בזמן אמת, האזנה, כתיבה, ועוזר שמסביר כל שאלה. הציון הרשמי נקבע במבחן של מאל״ו; הקורס מכין אליו.",
          primary: { href: `${COURSE}/quiz/quiz-entry-diagnostic`, label: "מבחן רמה חינם" },
          secondary: { href: AMIRANT_CONTINUE_PATH, label: "למודול המבוא" },
          note: "בלי כרטיס אשראי. 15 שאלות, הערכת רמה משוערת, לא ציון רשמי.",
        }}
      />

      <section id="scores" className="scroll-mt-20 bg-paper py-20 md:py-28">
        <Container max="shell">
          <ScoreBandsTable />
        </Container>
      </section>

      <MarketingSection id="path" title="איך הקורס בנוי" subtitle="שלושה שלבים, באותו סדר שבו המבחן בודק. כל תמונה היא המסך האמיתי של הקורס." tone="low">
        <CoursePathSteps steps={COURSE_PATH_STEPS} />
      </MarketingSection>

      <MarketingSection
        id="syllabus"
        title="תוכנית הקורס"
        subtitle={`${COURSE_FACTS.modules} מודולים, ${COURSE_FACTS.lessons} שיעורים, כ־${COURSE_FACTS.hours} שעות. זו התוכנית שרואים בתוך הקורס.`}
        tone="paper"
      >
        <CourseSyllabusTable />
      </MarketingSection>

      <MarketingSection id="exam" title={EXAM_STRUCTURE.title} subtitle={EXAM_STRUCTURE.subtitle} tone="navy">
        <ExamStructureTable />
      </MarketingSection>

      <AIValueSection />

      <ProseSection s={AMIRANT_WHO_FOR_SECTION} tone="low" />
      <ProseSection s={AMIRANT_REFORM_SECTION} tone="paper" />

      <MarketingSection id="plans" title="מחירים" subtitle="גישה מלאה לכל הקורס לתקופה שבוחרים. בלי מנוי מתחדש. מודול המבוא ומבחן הרמה חינם." tone="low">
        <PlansTable />
      </MarketingSection>

      <MarketingSection id="faq" title="שאלות נפוצות" tone="paper">
        <FaqList items={AMIRANT_FAQ} />
      </MarketingSection>

      <section id="demo" className="scroll-mt-20 bg-primary py-24 text-white md:py-32">
        <Container max="shell">
          <Reveal className="mx-auto max-w-[46rem] text-center">
            <h2 className="text-[2.2rem] font-black leading-[1.12] tracking-tight md:text-[2.9rem]">מתחילים במבחן רמה. 15 שאלות, עשר דקות, בלי תשלום.</h2>
            <p className="mx-auto mt-4 max-w-[38rem] text-lg leading-relaxed text-white/80 md:text-xl">
              בסוף: הערכת רמה משוערת, הנושאים החלשים, ומאיפה להתחיל בקורס. מודול המבוא פתוח גם הוא בלי תשלום.
            </p>
            <p className="mx-auto mt-3 max-w-[38rem] text-[16px] leading-relaxed text-white/70">
              רוצים לראות קודם איך השאלות נראות?{" "}
              <Link href={`${PREP_BASE}/amirant/sample-questions`} className="font-semibold text-white underline-offset-4 hover:underline">
                עשר שאלות לדוגמה עם תשובות
              </Link>
              , בלי הרשמה.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href={`${COURSE}/quiz/quiz-entry-diagnostic`}
                variant="primary"
                className="min-h-[3.25rem] !rounded !bg-white px-7 text-[16px] font-extrabold !text-primary hover:!bg-white/90"
              >
                התחלת מבחן הרמה
              </ButtonLink>
              <ButtonLink
                href={`${PREP_BASE}/pricing`}
                variant="secondary"
                className="min-h-[3.25rem] !rounded !border-white/55 !bg-transparent px-7 text-[16px] !text-white hover:!bg-white/10"
              >
                לרכישת גישה
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
