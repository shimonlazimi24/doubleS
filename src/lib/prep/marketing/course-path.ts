import type { PathStep } from "@/components/prep/marketing/CoursePathSteps";
import { COURSE_FACTS } from "@/lib/prep/marketing/course-facts";

/**
 * The three stages shown on the home and Amirant pages, each with a real
 * screenshot cropped to the part that matters, so it stays readable at half width.
 */
export const COURSE_PATH_STEPS: readonly PathStep[] = [
  {
    title: "מבחן רמה",
    body: "15 שאלות בסגנון המבחן: השלמת משפטים, ניסוח מחדש והבנת הנקרא. בסוף: הערכת רמה ונקודת התחלה בקורס. בלי תשלום.",
    image: { src: "/prep/shots/placement-crop.jpg", alt: "מבחן הרמה: שאלה 1 מתוך 15 עם ארבע אפשרויות וטיימר", width: 2208, height: 1272 },
  },
  {
    title: "השיטה, ואז תרגול לפי רמה",
    body: "לכל חלק במבחן מדריך שיטה והמלכודות הנפוצות, ואז יחידות תרגול מקל ועד קשה. אחרי כל בדיקה: הסבר קצר, ובלחיצה ההסבר המלא ולמה לא האפשרויות האחרות.",
    image: { src: "/prep/shots/practice-crop.jpg", alt: "מבחן תרגול אחרי בדיקה: תשובה נכונה מסומנת והסבר קצר פתוח", width: 1752, height: 1116 },
  },
  {
    title: "סימולציות, האזנה וכתיבה",
    body: `${COURSE_FACTS.simulations} מבחנים מלאים בתנאי זמן עם דוח אחרי כל אחד. מבחני האזנה עם הקלטות כמו במבחן, ומטלות כתיבה עם בדיקה ומשוב תוך דקה.`,
    image: { src: "/prep/shots/course-crop.jpg", alt: "תוכנית הקורס עם רשימת המודולים וההתקדמות בכל אחד", width: 2352, height: 864 },
  },
];
