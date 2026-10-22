import { AIValueSection } from "@/components/prep/marketing/AIValueSection";
import { SiteVideoSlot } from "@/components/prep/SiteVideoSlot";
import { getSiteVideos } from "@/lib/prep/site-settings.server";
import { CTASection } from "@/components/prep/marketing/CTASection";
import { CoursePathSteps } from "@/components/prep/marketing/CoursePathSteps";
import { CourseSyllabusTable } from "@/components/prep/marketing/CourseSyllabusTable";
import { ExamStructureTable } from "@/components/prep/marketing/ExamStructureCards";
import { HeroSection } from "@/components/prep/marketing/HeroSection";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { PlansTable } from "@/components/prep/marketing/PlansTable";
import { ScoreBandsTable } from "@/components/prep/marketing/ScoreBandsTable";
import { Container } from "@/components/ui";
import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";
import { COURSE_PATH_STEPS } from "@/lib/prep/marketing/course-path";

/**
 * The home page: the real course under a navy shade, the figures, why the
 * score matters, how the course is built (with real screenshots), the
 * syllabus, the exam, the assistant, the prices. Nothing boxed.
 */
export async function PrepMarketingHome() {
  const videos = await getSiteVideos();
  return (
    <>
      <HeroSection />
      <SiteVideoSlot src={videos.home} title="סרטון היכרות" className="bg-paper py-10 md:py-12" />

      <section id="why" className="scroll-mt-20 bg-paper py-20 md:py-28">
        <Container max="shell">
          <ScoreBandsTable />
        </Container>
      </section>

      <MarketingSection id="how" title="איך הקורס בנוי" subtitle="שלושה שלבים, באותו סדר שבו המבחן בודק. כל תמונה היא המסך האמיתי של הקורס." tone="low">
        <CoursePathSteps steps={COURSE_PATH_STEPS} />
      </MarketingSection>

      <MarketingSection
        id="syllabus"
        title="מה יש בקורס"
        subtitle={`${COURSE_FACTS.modules} מודולים, ${COURSE_FACTS.lessons} שיעורים, כ־${COURSE_FACTS.hours} שעות. התוכנית המלאה כפי שהיא מופיעה בתוך הקורס.`}
        tone="paper"
      >
        <CourseSyllabusTable compact />
      </MarketingSection>

      <MarketingSection id="exam" title={EXAM_STRUCTURE.title} subtitle={EXAM_STRUCTURE.subtitle} tone="navy">
        <ExamStructureTable />
      </MarketingSection>

      <AIValueSection />

      <MarketingSection id="plans" title="מחירים" subtitle="גישה מלאה לכל הקורס לתקופה שבוחרים. בלי מנוי מתחדש. מודול המבוא ומבחן הרמה חינם." tone="low">
        <PlansTable />
      </MarketingSection>

      <CTASection />
    </>
  );
}
