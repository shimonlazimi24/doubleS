import { AIValueSection } from "@/components/prep/marketing/AIValueSection";
import { SiteVideoSlot } from "@/components/prep/SiteVideoSlot";
import { getSiteVideos } from "@/lib/prep/site-settings.server";
import { CTASection } from "@/components/prep/marketing/CTASection";
import { CourseSyllabusTable } from "@/components/prep/marketing/CourseSyllabusTable";
import { ExamStructureTable } from "@/components/prep/marketing/ExamStructureCards";
import { HeroSection } from "@/components/prep/marketing/HeroSection";
import { MarketingSection } from "@/components/prep/marketing/MarketingSection";
import { PlansTable } from "@/components/prep/marketing/PlansTable";
import { Container } from "@/components/ui";
import { EXAM_STRUCTURE, HOW_IT_WORKS, WHY_IT_MATTERS } from "@/lib/prep/marketing/content";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

/**
 * The home page: what the course is, why the exam matters, how the course is
 * built (the real syllabus), what the exam looks like, what it costs. Facts
 * from the course itself, tables and lists, one real screenshot.
 */
export async function PrepMarketingHome() {
  const videos = await getSiteVideos();
  return (
    <>
      <HeroSection />
      <SiteVideoSlot src={videos.home} title="סרטון היכרות" className="border-t border-line bg-paper py-10 md:py-12" />

      <section id="why" className="border-t border-line bg-paper py-12 md:py-16">
        <Container max="shell">
          <div className="grid gap-6 lg:grid-cols-[minmax(13rem,17rem)_1fr] lg:gap-12">
            <header className="text-right">
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-[1.75rem]">{WHY_IT_MATTERS.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-muted">{WHY_IT_MATTERS.subtitle}</p>
            </header>
            <ul className="self-center">
              {WHY_IT_MATTERS.items.map((item) => (
                <li key={item.title} className="border-t border-line/70 py-3.5 first:border-t-0 first:pt-0 last:pb-0">
                  <p className="text-base leading-relaxed text-ink">
                    <span className="font-semibold">{item.title}.</span> <span className="text-muted">{item.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <MarketingSection id="how" title={HOW_IT_WORKS.title} subtitle={HOW_IT_WORKS.subtitle} tone="canvas">
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <li key={step.title} className="border-t border-line pt-3 text-right">
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
        title="מה יש בקורס"
        subtitle="התוכנית המלאה, כפי שהיא מופיעה בתוך הקורס. יחידות התרגול מדורגות מקל ועד הקשה ביותר."
        tone="paper"
      >
        <div className="max-w-4xl">
          <CourseSyllabusTable compact />
        </div>
      </MarketingSection>

      <MarketingSection id="exam" title={EXAM_STRUCTURE.title} subtitle={EXAM_STRUCTURE.subtitle} tone="canvas">
        <ExamStructureTable />
      </MarketingSection>

      <AIValueSection />

      <MarketingSection id="plans" title="מחירים" subtitle="גישה מלאה לקורס לתקופה שבוחרים. בלי מנוי מתחדש." tone="paper">
        <PlansTable />
      </MarketingSection>

      <CTASection />
    </>
  );
}
