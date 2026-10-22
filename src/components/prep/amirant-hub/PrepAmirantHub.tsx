import { ButtonLink, Container } from "@/components/ui";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";
import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { ProductShot } from "@/components/prep/marketing/ProductShot";
import { TrustIndicators } from "@/components/prep/marketing/TrustIndicators";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { ScoreBandsTable } from "@/components/prep/marketing/ScoreBandsTable";
import { CourseSyllabusTable } from "@/components/prep/marketing/CourseSyllabusTable";
import { ExamStructureTable } from "@/components/prep/marketing/ExamStructureCards";
import { PlansTable } from "@/components/prep/marketing/PlansTable";
import { AIValueSection } from "@/components/prep/marketing/AIValueSection";

const COURSE = `${PREP_BASE}/amirant/course`;

const PATH = [
  { title: "מבחן רמה", body: "15 שאלות בסגנון המבחן: 8 השלמת משפטים, 4 ניסוח מחדש, 3 הבנת הנקרא. בסוף: הערכת רמה ונקודת התחלה בקורס." },
  { title: "השיטה ואז תרגול לפי רמה", body: "לכל חלק במבחן מדריך שיטה, המלכודות הנפוצות, ויחידות תרגול מדורגות מקל ועד הקשה ביותר, עם הסבר מלא לכל שאלה." },
  { title: "סימולציות מלאות", body: `${COURSE_FACTS.simulations} מבחנים מלאים בתנאי זמן, ואחרי כל אחד דוח: מה נכון, מה לא, ומה לתרגל.` },
] as const;

/**
 * The Amirant course page for visitors: what the exam is worth, what the
 * course contains, what it costs. Facts from exam-facts and the course
 * manifest; a real screenshot; tables rather than coloured graphics.
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
      <section className="border-b border-line bg-paper">
        <Container className="py-12 md:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-14">
            <div className="text-right">
              <p className="mb-3 text-sm font-semibold text-muted">קורס הכנה לאמירנט</p>
              <h1 className="text-[2rem] font-extrabold leading-[1.12] tracking-tight text-ink md:text-[2.5rem]">
                להגיע לפטור, או קרוב אליו, בלי קורסי השלמה מיותרים
              </h1>
              <p className="mt-4 max-w-[34rem] text-[17px] leading-relaxed text-muted">
                שיעורי שיטה, יחידות תרגול מדורגות לכל חלק במבחן, סימולציות מלאות בזמן אמת, ועוזר שמסביר כל שאלה. הציון הרשמי נקבע
                במבחן של מאל״ו; הקורס מכין אליו.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ButtonLink href={`${COURSE}/quiz/quiz-entry-diagnostic`} variant="primary" className="min-h-11 !rounded px-6 text-[15px] font-bold">
                  מבחן רמה חינם
                </ButtonLink>
                <ButtonLink href={AMIRANT_CONTINUE_PATH} variant="secondary" className="min-h-11 !rounded px-6 text-[15px]">
                  למודול המבוא
                </ButtonLink>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">בלי כרטיס אשראי. 15 שאלות, הערכת רמה משוערת, לא ציון רשמי.</p>
              <TrustIndicators items={trust} className="mt-8" />
            </div>
            <ProductShot priority />
          </div>
        </Container>
      </section>

      <MarketingSection id="scores" title="כמה כל ציון שווה" subtitle="רמות המיון הרשמיות. כל מדרגה למעלה היא פחות קורסי אנגלית בתואר." tone="paper">
        <ScoreBandsTable />
      </MarketingSection>

      <MarketingSection id="path" title="איך הקורס בנוי" subtitle="שלושה שלבים, באותו סדר שבו המבחן בודק." tone="canvas">
        <ol className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          {PATH.map((step, i) => (
            <li key={step.title} className="border-t border-line pt-3">
              <p className="text-sm text-muted">שלב {i + 1}</p>
              <h3 className="mt-1 text-base font-bold text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection
        id="syllabus"
        eyebrow={`${COURSE_FACTS.modules} מודולים · ${COURSE_FACTS.lessons} שיעורים · כ־${COURSE_FACTS.hours} שעות`}
        title="תוכנית הקורס"
        subtitle="כל מודול, מה יש בו וכמה זמן הוא לוקח. זו התוכנית שרואים בתוך הקורס."
        tone="paper"
      >
        <div className="max-w-4xl">
          <CourseSyllabusTable />
        </div>
      </MarketingSection>

      <MarketingSection id="exam" title={EXAM_STRUCTURE.title} subtitle={EXAM_STRUCTURE.subtitle} tone="canvas">
        <ExamStructureTable />
      </MarketingSection>

      <AIValueSection />

      <MarketingSection id="plans" title="מחירים" subtitle="גישה מלאה לקורס לתקופה שבוחרים. בלי מנוי מתחדש." tone="paper">
        <PlansTable />
      </MarketingSection>

      <section id="demo" className="scroll-mt-20 border-t border-line bg-canvas py-12 md:py-16">
        <Container max="shell">
          <div className="max-w-2xl text-right">
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-[1.75rem]">מתחילים במבחן רמה</h2>
            <p className="mt-2 text-base leading-relaxed text-muted">
              15 שאלות, כעשר דקות. בסוף: הערכת רמה משוערת, הנושאים החלשים, ומאיפה להתחיל בקורס. מודול המבוא פתוח גם הוא בלי תשלום.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href={`${COURSE}/quiz/quiz-entry-diagnostic`} variant="primary" className="min-h-11 !rounded px-6 text-[15px] font-bold">
                התחלת מבחן הרמה
              </ButtonLink>
              <ButtonLink href={`${PREP_BASE}/pricing`} variant="secondary" className="min-h-11 !rounded px-6 text-[15px]">
                לרכישת גישה
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
