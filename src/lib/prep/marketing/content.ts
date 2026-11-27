import { AMIRANT_PREPARATION_MANIFEST, countManifestLessons } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";

const LESSON_COUNT = countManifestLessons(AMIRANT_PREPARATION_MANIFEST);
const SIM_COUNT = AMIRANT_PREPARATION_MANIFEST.simulations.length;

export const MARKETING_HERO = {
  headline: "הכנה לאמירנט, עד הפטור ובלי קורסי השלמה מיותרים",
  subheadline:
    "שיעורים, תרגול לפי רמה, סימולציות מלאות ועוזר שעונה על שאלות בתוך השיעור. את הציון הרשמי קובע רק המבחן של מאל״ו, ואליו אנחנו מכינים.",
  ctaPrimary: { label: "מבחן רמה חינם", href: `${PREP_BASE}/amirant/course/quiz/quiz-entry-diagnostic` },
  // Entry goes through /amirant/continue, which routes login → onboarding → course.
  // Linking straight at the course skipped that and dropped people into the old flow.
  ctaSecondary: { label: "התחל במבוא החינמי", href: `${PREP_BASE}/amirant/continue` },
  trust: [
    { value: String(LESSON_COUNT), label: "שיעורים בקורס" },
    { value: "500+", label: "שאלות תרגול עם הסברים" },
    { value: String(SIM_COUNT), label: "סימולציות מלאות בטיימר" },
    { value: "AI", label: "עוזר בגישה המלאה" },
  ],
} as const;

export const EXAM_STRUCTURE = {
  title: "מבנה מבחן אמירנט",
  subtitle: "שלושה סוגי שאלות, ולכל אחד שיטה משלו. הזמנים הם לכל פרק, לא לכל המבחן.",
  parts: [
    {
      title: "השלמת משפטים",
      meta: "4 שאלות · 4 דק׳ לפרק",
      body: "בחירת מילה או ביטוי שמשלים משפט אקדמי בהקשר הנכון.",
    },
    {
      title: "ניסוח מחדש",
      meta: "3 שאלות · 6 דק׳ לפרק",
      body: "בחירת המשפט שאומר את אותו הדבר כמו המקור, גם כשהמבנה שונה.",
    },
    {
      title: "הבנת הנקרא",
      meta: "5 שאלות · 15 דק׳ לפרק",
      body: "קטע אקדמי ושאלות על רעיון מרכזי, פרטים והסקות.",
    },
  ],
} as const;

export const MARKETING_CTA = {
  title: "מתחילים ממבחן הרמה",
  subtitle: "15 שאלות בסגנון המבחן, בלי תשלום. בסוף תדעו באיזו רמה אתם ומאיפה להתחיל בקורס.",
  primary: { label: "התחילו במבחן רמה חינם", href: `${PREP_BASE}/amirant/course/quiz/quiz-entry-diagnostic` },
  secondary: { label: "לצפייה במחירים", href: `${PREP_BASE}/pricing` },
} as const;
