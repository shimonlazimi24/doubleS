import { AMIRANT_PREPARATION_MANIFEST, countManifestLessons } from "@/lib/amirant-course";
import { PREP_BASE } from "@/lib/prep/constants";

const LESSON_COUNT = countManifestLessons(AMIRANT_PREPARATION_MANIFEST);
const SIM_COUNT = AMIRANT_PREPARATION_MANIFEST.simulations.length;

export const MARKETING_HERO = {
  headline: "הכנה לאמירנט - כדי להגיע לפטור בלי קורסי השלמה מיותרים",
  subheadline:
    "שיעורים, תרגול אדפטיבי, סימולציות מלאות וליווי AI. הציון הרשמי נקבע רק במבחן מאל״ו - אנחנו מכינים אתכם אליו.",
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

export const WHY_IT_MATTERS = {
  title: "למה זה חשוב לפני התואר",
  subtitle: "מיון אנגלית קובע עומס לימודים, זמן ועלות - הכנה נכונה מקדימה חוסכת סמסטרים.",
  items: [
    {
      title: "פטור וציון",
      body: "ציון במבחן המיון משפיע על כמה קורסי אנגלית תילקחו - ועל כמה זמן וכסף תשקיעו בתואר. אנחנו לא קובעים את הציון - מאל״ו כן.",
    },
    {
      title: "אנגלית אקדמית",
      body: "הבנת הנקרא, אוצר מילים וניתוח תחבירי - הבסיס לקריאת חומרים, מבחנים ומחקר.",
    },
    {
      title: "למידה בוגרת",
      body: "מסלול ברור שמתאים לחיים עמוסים: מה ללמוד, מתי, ואיך למדוד התקדמות.",
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  title: "איך הקורס עובד",
  subtitle: "מבנה קבוע - בלי להיתקע בתוכן לא מסודר.",
  steps: [
    { step: "01", title: "מידע ומבוא", body: "מכירים את המבחן, הסילבוס ומבחן לדוגמה - לפני שמתחייבים." },
    { step: "02", title: "שיעורים ותרגול", body: "יחידות לפי נושאים: אוצר מילים, קריאה, ניסוח מחדש והשלמת משפטים." },
    { step: "03", title: "סימולציות", body: "מבחני תרגול בקצב אמיתי - פרקים, טיימר וניווט כמו באמירנט." },
    { step: "04", title: "מעקב והמשך", body: "דשבורד התקדמות, חיזוק חולשות וגישה לקורס המלא אחרי רכישה." },
  ],
} as const;

export const EXAM_STRUCTURE = {
  title: "מבנה מבחן אמירנט",
  subtitle: "שלושה סוגי שאלות מרכזיים - כל אחד עם אסטרטגיה משלו. הזמנים למטה הם לפי פרק אדפטיבי, לא כל המבחן.",
  parts: [
    {
      title: "השלמת משפטים",
      meta: "4 שאלות · 4 דק׳ לפרק",
      body: "בחירת מילה או ביטוי שמשלים משפט אקדמי בהקשר הנכון.",
    },
    {
      title: "ניסוח מחדש",
      meta: "3 שאלות · 6 דק׳ לפרק",
      body: "זיהוי משפט שקול במשמעות למקור - גם כשהמבנה משתנה.",
    },
    {
      title: "הבנת הנקרא",
      meta: "5 שאלות · 15 דק׳ לפרק",
      body: "קטע אקדמי ושאלות על רעיון מרכזי, פרטים והסקות.",
    },
  ],
} as const;

export const WHAT_YOU_GET = {
  title: "מה מקבלים בקורס",
  subtitle: "כלים שמיועדים לסטודנטים שמתכוננים לתואר - לא לתרגול כללי.",
  features: [
    { title: "סילבוס מאל״ו", body: "מבוא, מיומנויות ליבה, סימולציות וסיכום - בסדר לימוד מומלץ. (הקורס עצמאי, לא רשמי של מאל״ו.)" },
    { title: "בנק תרגול", body: "שאלות לפי נושאים ורמות קושי, כולל מבחנים מלאים." },
    { title: "דשבורד אישי", body: "התקדמות לפי מודולים, זיהוי נקודות לחיזוק." },
    { title: "שמירה בענן", body: "המשכיות בין מכשירים אחרי התחברות (כשהשירות זמין)." },
  ],
} as const;

export const AI_VALUE = {
  title: "תרגול חכם וליווי AI",
  subtitle: "משוב ממוקד על החומר שלכם - לא צ'אט גנרי.",
  points: [
    "סיכום שיעור ונקודות לתרגול אחרי כל יחידה",
    "המלצות לפי ביצועים במבחנים ותרגולים",
    "הסברים בהקשר השאלה - בלי להמציא תוכן שלא בקורס",
  ],
  note: "עוזר ה-AI זמין במסגרת גישה מלאה לקורס, בכפוף להגדרות המערכת.",
} as const;

export const MARKETING_CTA = {
  title: "מוכנים להתחיל?",
  subtitle: "מודול המבוא ומבחן הרמה פתוחים חינם - הקורס המלא בגישה משבוע עד חודש, לפי הקצב שלכם.",
  primary: { label: "התחילו במבחן רמה חינם", href: `${PREP_BASE}/amirant/course/quiz/quiz-entry-diagnostic` },
  secondary: { label: "לצפייה במחירים", href: `${PREP_BASE}/pricing` },
} as const;
