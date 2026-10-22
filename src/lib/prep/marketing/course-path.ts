import type { PathStep } from "@/components/prep/marketing/CoursePathSteps";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

/** The three stages shown on the home and Amirant pages, each with a real screenshot (2880×1800). */
export const COURSE_PATH_STEPS: readonly PathStep[] = [
  {
    title: "מבחן רמה",
    body: "15 שאלות בסגנון המבחן: השלמת משפטים, ניסוח מחדש והבנת הנקרא. בסוף: הערכת רמה ונקודת התחלה בקורס. בלי תשלום.",
    image: { src: "/prep/shots/placement.jpg", alt: "מבחן הרמה: שאלה 1 מתוך 15 עם ארבע אפשרויות וטיימר", width: 2880, height: 1800 },
  },
  {
    title: "השיטה, ואז תרגול לפי רמה",
    body: "לכל חלק במבחן מדריך שיטה והמלכודות הנפוצות, ואז יחידות תרגול מקל ועד קשה. אחרי כל בדיקה: הסבר קצר, ובלחיצה ההסבר המלא ולמה לא האפשרויות האחרות.",
    image: { src: "/prep/shots/practice.jpg", alt: "מבחן תרגול אחרי בדיקה: תשובה נכונה מסומנת והסבר קצר פתוח", width: 2880, height: 1800 },
  },
  {
    title: "סימולציות, האזנה וכתיבה",
    body: `${COURSE_FACTS.simulations} מבחנים מלאים בתנאי זמן עם דוח אחרי כל אחד. מבחני האזנה עם הקלטות כמו במבחן, ומטלות כתיבה עם בדיקה ומשוב תוך דקה.`,
    image: { src: "/prep/shots/course.jpg", alt: "תוכנית הקורס עם רשימת המודולים וההתקדמות בכל אחד", width: 2880, height: 1800 },
  },
];
