import { ButtonLink, Container } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";
import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { HeroVideoBackground } from "@/components/prep/marketing/HeroVideoBackground";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { ScoreBandsTable } from "@/components/prep/marketing/ScoreBandsTable";
import { CoursePathSteps } from "@/components/prep/marketing/CoursePathSteps";
import { CourseSyllabusTable } from "@/components/prep/marketing/CourseSyllabusTable";
import { ExamStructureTable } from "@/components/prep/marketing/ExamStructureCards";
import { PlansTable } from "@/components/prep/marketing/PlansTable";
import { AIValueSection } from "@/components/prep/marketing/AIValueSection";
import { FaqList } from "@/components/prep/marketing/FaqList";
import { SectionPanel } from "@/components/prep/marketing/SectionPanel";
import { AMIRANT_FAQ, AMIRANT_REFORM_SECTION, AMIRANT_WHO_FOR_SECTION } from "@/lib/prep/marketing/amirant-seo-content";

const COURSE = `${PREP_BASE}/amirant/course`;

const PATH = [
  {
    title: "מבחן רמה",
    body: "15 שאלות בסגנון המבחן: 8 השלמת משפטים, 4 ניסוח מחדש, 3 הבנת הנקרא. בסוף: הערכת רמה ונקודת התחלה בקורס.",
    image: { src: "/prep/shots/placement.jpg", alt: "מבחן הרמה: שאלה 1 מתוך 15 עם ארבע אפשרויות וטיימר" },
  },
  {
    title: "השיטה ואז תרגול לפי רמה",
    body: "לכל חלק במבחן מדריך שיטה, המלכודות הנפוצות, ויחידות תרגול מדורגות מקל ועד הקשה ביותר, עם הסבר מלא לכל שאלה.",
    image: { src: "/prep/shots/lesson.jpg", alt: "שיעור במדריך השיטות: שיטה 1, משפט לדוגמה וטבלת רמזים" },
  },
  {
    title: "סימולציות מלאות",
    body: `${COURSE_FACTS.simulations} מבחנים מלאים בתנאי זמן, ואחרי כל אחד דוח: מה נכון, מה לא, ומה לתרגל.`,
    image: { src: "/prep/shots/course.jpg", alt: "תוכנית הקורס עם רשימת המודולים וההתקדמות בכל אחד" },
  },
] as const;

/**
 * The Amirant course page for visitors: the real course under a navy shade,
 * what the exam is worth, what the course contains, what it costs.
 */
export function PrepAmirantHub() {
  const trust = [
    { value: String(COURSE_FACTS.lessons), label: "שיעורים" },
    { value: String(COURSE_FACTS.practiceUnits), label: "יחידות תרגול לפי רמה" },
    { value: String(COURSE_FACTS.simulations), label: "סימולציות מלאות" },
    { value: String(COURSE_FACTS.questions), label: "שאלות עם הסבר" },
  ];
  return (
    <div dir="rtl" className="bg-paper">
      <section className="relative flex min-h-[calc(100svh-6.5rem)] items-center text-white lg:min-h-[calc(100svh-4rem)]">
        <HeroVideoBackground src="/prep/hero-bg.mp4" poster="/prep/hero-poster.jpg" />
        <Container className="relative py-20 md:py-28">
          <div className="max-w-[40rem] text-right">
            <p className="mb-4 text-sm font-semibold text-white/80">קורס הכנה לאמירנט</p>
            <h1 className="text-[2.4rem] font-extrabold leading-[1.1] tracking-tight md:text-[3.4rem]">
              להגיע לפטור, או קרוב אליו, בלי קורסי השלמה מיותרים
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-white/85 md:text-xl">
              שיעורי שיטה, יחידות תרגול מדורגות לכל חלק במבחן, סימולציות מלאות בזמן אמת, ועוזר שמסביר כל שאלה. הציון הרשמי נקבע
              במבחן של מאל״ו; הקורס מכין אליו.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={`${COURSE}/quiz/quiz-entry-diagnostic`}
                variant="primary"
                className="min-h-12 !rounded !bg-white px-7 text-[15px] font-bold !text-primary hover:!bg-white/90"
              >
                מבחן רמה חינם
              </ButtonLink>
              <ButtonLink
                href={AMIRANT_CONTINUE_PATH}
                variant="secondary"
                className="min-h-12 !rounded !border-white/50 !bg-transparent px-7 text-[15px] !text-white hover:!bg-white/10"
              >
                למודול המבוא
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">בלי כרטיס אשראי. 15 שאלות, הערכת רמה משוערת, לא ציון רשמי.</p>
          </div>
        </Container>
      </section>
      <section className="border-b border-line bg-paper">
        <Container className="py-6 md:py-8">
          <TrustIndicators items={trust} />
        </Container>
      </section>

      <MarketingSection id="scores" title="כמה כל ציון שווה" subtitle="רמות המיון הרשמיות. כל מדרגה למעלה היא פחות קורסי אנגלית בתואר." tone="low">
        <ScoreBandsTable />
      </MarketingSection>

      <MarketingSection id="path" title="איך הקורס בנוי" subtitle="שלושה שלבים, באותו סדר שבו המבחן בודק. כל תמונה היא המסך האמיתי." tone="paper">
        <CoursePathSteps steps={PATH} />
      </MarketingSection>

      <MarketingSection id="syllabus" title="תוכנית הקורס" subtitle="כל מודול, מה יש בו וכמה זמן הוא לוקח. זו התוכנית שרואים בתוך הקורס." tone="low">
        <CourseSyllabusTable />
      </MarketingSection>

      <MarketingSection id="exam" title={EXAM_STRUCTURE.title} subtitle={EXAM_STRUCTURE.subtitle} tone="paper">
        <ExamStructureTable />
      </MarketingSection>

      <AIValueSection />

      <MarketingSection id={AMIRANT_WHO_FOR_SECTION.id} title={AMIRANT_WHO_FOR_SECTION.headingHe} tone="paper">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-[38rem]">
            {AMIRANT_WHO_FOR_SECTION.paragraphsHe.map((p) => (
              <p key={p.slice(0, 40)} className="mb-4 text-[17px] leading-relaxed text-muted last:mb-0">
                {p}
              </p>
            ))}
          </div>
          {AMIRANT_WHO_FOR_SECTION.bulletsHe?.length ? (
            <SectionPanel className="p-6">
              <ul className="divide-y divide-line/70">
                {AMIRANT_WHO_FOR_SECTION.bulletsHe.map((b) => (
                  <li key={b} className="py-3 text-[15px] leading-relaxed text-ink first:pt-0 last:pb-0">
                    {b}
                  </li>
                ))}
              </ul>
            </SectionPanel>
          ) : null}
        </div>
      </MarketingSection>

      <MarketingSection id={AMIRANT_REFORM_SECTION.id} eyebrow={AMIRANT_REFORM_SECTION.eyebrowHe} title={AMIRANT_REFORM_SECTION.headingHe} tone="low">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-[38rem]">
            {AMIRANT_REFORM_SECTION.paragraphsHe.map((p) => (
              <p key={p.slice(0, 40)} className="mb-4 text-[17px] leading-relaxed text-muted last:mb-0">
                {p}
              </p>
            ))}
          </div>
          {AMIRANT_REFORM_SECTION.bulletsHe?.length ? (
            <SectionPanel className="p-6">
              <ul className="divide-y divide-line/70">
                {AMIRANT_REFORM_SECTION.bulletsHe.map((b) => (
                  <li key={b} className="py-3 text-[15px] leading-relaxed text-ink first:pt-0 last:pb-0">
                    {b}
                  </li>
                ))}
              </ul>
            </SectionPanel>
          ) : null}
        </div>
      </MarketingSection>

      <MarketingSection id="plans" title="מחירים" subtitle="גישה מלאה לקורס לתקופה שבוחרים. בלי מנוי מתחדש." tone="paper">
        <PlansTable />
      </MarketingSection>

      <MarketingSection id="faq" title="שאלות נפוצות" tone="low">
        <FaqList items={AMIRANT_FAQ} />
      </MarketingSection>

      <section id="demo" className="scroll-mt-20 bg-primary py-16 text-white md:py-24">
        <Container max="shell">
          <div className="max-w-2xl text-right">
            <h2 className="text-[1.9rem] font-extrabold leading-[1.15] tracking-tight md:text-[2.4rem]">מתחילים במבחן רמה</h2>
            <p className="mt-3 text-lg leading-relaxed text-white/80">
              15 שאלות, כעשר דקות. בסוף: הערכת רמה משוערת, הנושאים החלשים, ומאיפה להתחיל בקורס. מודול המבוא פתוח גם הוא בלי תשלום.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={`${COURSE}/quiz/quiz-entry-diagnostic`}
                variant="primary"
                className="min-h-12 !rounded !bg-white px-7 text-[15px] font-bold !text-primary hover:!bg-white/90"
              >
                התחלת מבחן הרמה
              </ButtonLink>
              <ButtonLink
                href={`${PREP_BASE}/pricing`}
                variant="secondary"
                className="min-h-12 !rounded !border-white/50 !bg-transparent px-7 text-[15px] !text-white hover:!bg-white/10"
              >
                לרכישת גישה
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
