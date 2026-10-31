import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import {
  EXAM_AUTHORITY,
  EXAM_FACTS_VERIFICATION,
  EXAM_PILOT,
  EXAM_QUESTION_SHARE,
  EXAM_REFORM,
  EXAM_SCORE_BANDS,
  EXAM_SCORE_SCALE,
  EXAM_SCORED_MINUTES,
  EXAM_SCORED_QUESTION_COUNT,
  EXAM_SCORED_SEGMENTS,
  EXAM_TOTAL_MINUTES,
} from "@/lib/amirant-course/exam-facts";
import {
  AMIRANT_COURSE_COUNTS,
  AMIRANT_FAQ,
  AMIRANT_PLAN_FACTS,
} from "@/lib/prep/marketing/amirant-seo-content";
import { SUPPORT_EMAIL } from "@/lib/prep/marketing-pages";
import { PLAN_DAYS, PLAN_PRICES_NIS } from "@/lib/prep/pricing-plans";

export type LlmsTxtPost = { slug: string; title: string; description: string; date: string };

/**
 * One knowledge document for `/llms.txt` (domain root - where AI agents look)
 * and `/prep/llms.txt`. Every figure comes from exam-facts.ts, the course
 * manifest, the pricing table or the shared FAQ - the same sources the pages
 * render - so a generative engine quoting this file quotes the product.
 */
export function buildLlmsTxtBody(baseUrl: string, posts: readonly LlmsTxtPost[] = []): string {
  const c = AMIRANT_COURSE_COUNTS;
  const prep = `${baseUrl}/prep`;
  const rc = EXAM_SCORED_SEGMENTS.find((s) => s.type === "reading_comprehension");

  const sections: string[] = [];

  sections.push(`# PREPARE - הכנה לאמירנט אונליין
> ${prep}
> קורס הכנה דיגיטלי בעברית למבחן האמירנט (מבחן האנגלית האקדמי של ${EXAM_AUTHORITY.shortHe}). קורס עצמאי - אינו קשור ל${EXAM_AUTHORITY.shortHe} ואינו גוף רשמי של הבחינה.`);

  sections.push(`## מה זה PREPARE?
PREPARE (getprepared.academy) הוא פלטפורמת הכנה דיגיטלית לאמירנט - מבחן האנגלית האקדמי הממוחשב והאדפטיבי הנדרש לקבלה לאוניברסיטאות ומכללות בישראל ולסיווג לרמת אנגלית (פטור, מתקדמים, בסיסי). הקורס כולו בעברית, נלמד אונליין בקצב אישי, וכולל שיעורים, תרגול אדפטיבי, סימולציות מלאות ועוזר AI.
- שפת הממשק והלימוד: עברית (חומרי התרגול באנגלית)
- מתאים למועמדים וסטודנטים לפני תואר, למבחן חוזר ולמי שלמדו אנגלית מזמן
- מודול המבוא ומבחן הרמה פתוחים בחינם, בלי כרטיס אשראי
- הציון הרשמי נקבע רק במבחן ${EXAM_AUTHORITY.shortHe}; מבחן הרמה באתר הוא הערכה משוערת ולא ציון רשמי
- אין הבטחת ציון, פטור או קבלה
- תמיכה: ${SUPPORT_EMAIL}`);

  sections.push(`## קורס ההכנה לאמירנט - מה כולל
- ${c.modules} מודולים, ${c.lessons} שיעורים בסדר לימוד מומלץ
- אוצר מילים אקדמי בארבע רמות (קל, בינוני, מתקדמים, מומחה) + Phrasal Verbs ומילות קישור
- ${c.sentenceCompletionTests} מבחני תרגול בהשלמת משפטים (Sentence Completion), מרמה קלה ועד הקשה ביותר
- ${c.restatementSets} מקבצי תרגול בניסוח מחדש (Restatement)
- ${c.readingPassages} קטעי קריאה אקדמיים עם שאלות הבנת הנקרא (Reading Comprehension)
- מודול רפורמה 2026: הבנת הנשמע, ${c.wordFormationTests} מבחני יצירת מילה (Word Formation), דקדוק בהקשר וכתיבה
- ${c.simulations} סימולציות מלאות עם טיימר נפרד לכל פרק ודוח אישי
- תרגול אדפטיבי - רמת הקושי מסתגלת לביצועים (סולם 1-6)
- דשבורד התקדמות וזיהוי נקודות חולשה אחרי כל תרגול
- עוזר AI בעברית בגישה המלאה (רמזים והסברים בהקשר השיעור)
- כל שאלה מגיעה עם הסבר לתשובה`);

  sections.push(`## מודולי הקורס
${AMIRANT_PREPARATION_MANIFEST.modules.map((m) => `- ${m.title}: ${m.lessons.length} שיעורים`).join("\n")}`);

  sections.push(`## מחירים (${prep}/pricing)
גישה מלאה לכל הקורס לזמן קצוב. תשלום חד-פעמי בשקלים, לא מנוי מתחדש:
${AMIRANT_PLAN_FACTS.map((p) => `- גישה ל${p.labelHe} (${p.days} ימים): ${p.priceNis} ₪`).join("\n")}
הארכה מתוך החשבון: שבוע ${PLAN_PRICES_NIS.ext_week} ₪, שבועיים ${PLAN_PRICES_NIS.ext_two_weeks} ₪, חודש ${PLAN_PRICES_NIS.ext_month} ₪ (${PLAN_DAYS.ext_month} ימים).
הסליקה בדף תשלום מאובטח של חברת הסליקה; פרטי כרטיס אינם עוברים בשרתי האתר.`);

  sections.push(`## מבנה מבחן האמירנט
- ${EXAM_SCORED_SEGMENTS.length} פרקים מנוקדים: ${EXAM_SCORED_QUESTION_COUNT} שאלות, ${EXAM_SCORED_MINUTES} דקות
- Sentence Completion (השלמת משפטים): ${EXAM_QUESTION_SHARE.sentence_completion} שאלות
- Restatement (ניסוח מחדש): ${EXAM_QUESTION_SHARE.rephrasing} שאלות
- Reading Comprehension (הבנת הנקרא): קטע + ${rc?.questionCount ?? EXAM_QUESTION_SHARE.reading_comprehension} שאלות
- ${EXAM_PILOT.segmentsMin}-${EXAM_PILOT.segmentsMax} פרקי ניסוי (לא נספרים בציון): עד ${EXAM_PILOT.maxMinutes} דקות; מיומנויות שנצפו: ${EXAM_PILOT.skillsHe.join(", ")}
- משך כולל: כ-${EXAM_TOTAL_MINUTES.min}-${EXAM_TOTAL_MINUTES.max} דקות
- המבחן אדפטיבי: רמת השאלות מסתגלת לביצועים
- סולם ציונים: ${EXAM_SCORE_SCALE.min}-${EXAM_SCORE_SCALE.max}. אין ציון נכשל רשמי; כל מוסד קובע סף משלו
${EXAM_SCORE_BANDS.map((b) => `- ${b.min}-${b.max}: ${b.levelHe} - ${b.meaningHe}`).join("\n")}
- מרפורמת ${EXAM_REFORM.dateHe} (${EXAM_REFORM.isoDate}): הקראת טקסט (Text-to-Speech) לכל נבחן, ופרקי ניסוי חדשים שאינם נספרים בציון
- מקור רשמי: ${EXAM_FACTS_VERIFICATION.sourceUrl} (נתוני המבחן נבדקו מול הפרסום הידוע ב-${EXAM_FACTS_VERIFICATION.checkedOn}; במבחן אדפטיבי מספר הפריטים בפועל עשוי להשתנות בין נבחנים)`);

  sections.push(`## שאלות נפוצות
${AMIRANT_FAQ.map((f) => `**${f.q}**\n${f.a}`).join("\n\n")}`);

  if (posts.length) {
    sections.push(`## מדריכים (${prep}/blog)
${posts.map((p) => `- [${p.title}](${prep}/blog/${p.slug}) - ${p.description}`).join("\n")}
הטקסט המלא של כל המדריכים בקובץ אחד: ${baseUrl}/llms-full.txt`);
  }

  sections.push(`## שאלות לדוגמה (${prep}/amirant/sample-questions)
עשר שאלות מכל סוגי הפרקים, עם התשובה וההסבר לכל שאלה, בלי הרשמה ובלי טיימר. מתוך מדריכי השיטות של הקורס; לא מתוך מבחני התרגול או הסימולציות.`);

  sections.push(`## קישורים מרכזיים
- דף הבית: ${prep}
- דף הקורס: ${prep}/amirant
- שאלות לדוגמה: ${prep}/amirant/sample-questions
- מחירים: ${prep}/pricing
- מדריכים: ${prep}/blog
- אודות: ${prep}/about
- יצירת קשר: ${prep}/contact
- תקנון: ${prep}/terms
- מדיניות פרטיות: ${prep}/privacy
- כניסה לקורס (דורש התחברות): ${prep}/amirant/course`);

  return sections.join("\n\n") + "\n";
}
