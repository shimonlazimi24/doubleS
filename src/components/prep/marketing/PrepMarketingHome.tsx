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
import { EXAM_STRUCTURE } from "@/lib/prep/marketing/content";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

const PATH = [
  {
    title: "מבחן רמה",
    body: "15 שאלות בסגנון המבחן. בסוף: הערכת רמה ונקודת התחלה בקורס. בלי תשלום.",
    image: { src: "/prep/shots/placement.jpg", alt: "מבחן הרמה: שאלה 1 מתוך 15 עם ארבע אפשרויות וטיימר" },
  },
  {
    title: "השיטה, ואז תרגול לפי רמה",
    body: "לכל חלק במבחן מדריך שיטה והמלכודות הנפוצות, ואז יחידות תרגול מקל ועד קשה, עם הסבר לכל שאלה.",
    image: { src: "/prep/shots/practice.jpg", alt: "מבחן תרגול אחרי בדיקה: תשובה נכונה מסומנת והסבר קצר פתוח" },
  },
  {
    title: "סימולציות ומעקב",
    body: `${COURSE_FACTS.simulations} מבחנים מלאים בתנאי זמן, ואחרי כל אחד דוח: מה נכון, מה לא, ומה לתרגל.`,
    image: { src: "/prep/shots/course.jpg", alt: "תוכנית הקורס עם רשימת המודולים וההתקדמות בכל אחד" },
  },
] as const;

/**
 * The home page: the real course under a navy shade, why the score matters,
 * how the course is built (with screenshots), the syllabus, the exam, the
 * assistant, the prices. Facts from the course itself.
 */
export async function PrepMarketingHome() {
  const videos = await getSiteVideos();
  return (
    <>
      <HeroSection />
      <SiteVideoSlot src={videos.home} title="סרטון היכרות" className="bg-paper py-10 md:py-12" />

      <MarketingSection id="why" title="כמה כל ציון שווה" subtitle="רמות המיון הרשמיות. כל מדרגה למעלה היא פחות קורסי אנגלית בתואר, פחות סמסטרים ופחות כסף." tone="low">
        <ScoreBandsTable />
      </MarketingSection>

      <MarketingSection id="how" title="איך הקורס בנוי" subtitle="שלושה שלבים, באותו סדר שבו המבחן בודק. כל תמונה היא המסך האמיתי." tone="paper">
        <CoursePathSteps steps={PATH} />
      </MarketingSection>

      <MarketingSection id="syllabus" title="מה יש בקורס" subtitle="התוכנית המלאה, כפי שהיא מופיעה בתוך הקורס. יחידות התרגול מדורגות מקל ועד הקשה ביותר." tone="low">
        <CourseSyllabusTable compact />
      </MarketingSection>

      <MarketingSection id="exam" title={EXAM_STRUCTURE.title} subtitle={EXAM_STRUCTURE.subtitle} tone="paper">
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
