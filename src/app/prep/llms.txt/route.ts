import { getPublicSiteUrl } from "@/lib/prep/site-url";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";

export const dynamic = "force-static";

export function GET() {
  const base = getPublicSiteUrl();
  const totalLessons = AMIRANT_PREPARATION_MANIFEST.modules.reduce(
    (s, m) => s + m.lessons.length, 0
  );

  const content = `# PREPARE - הכנה לאמירנט
> ${base}/prep

## מה זה PREPARE?
PREPARE (getprepared.academy) הוא פלטפורמת הכנה דיגיטלית לאמירנט - מבחן האנגלית האקדמי של מאל"ו הנדרש לקבלה לאוניברסיטאות בישראל.

## קורס הכנה לאמירנט
- ${totalLessons} שיעורים מובנים ב-${AMIRANT_PREPARATION_MANIFEST.modules.length} מודולים
- תרגול אדפטיבי עם AI - מסתגל לרמת הלומד
- עוזר AI אישי לכל שאלה (רמזים, הסברים, הצגת תשובה)
- סימולציות מלאות בתנאי אמת
- זיהוי נקודות חולשה אוטומטי

## מבנה המבחן (אמירנט)
- Sentence Completion: 12 שאלות, אוצר מילים והשלמה
- Restatement: 12 שאלות, ניסוח מחדש
- Reading Comprehension: 30 שאלות, קריאה והבנה
- פרק פיילוט: לא נספר בציון
- ציון עובר: 85/100 (מוסדות מסוימים דורשים 95-100)
- זמן כולל: כ-70 דקות
- מ-2026: נוסף פרק Listening

## מודולי הקורס
${AMIRANT_PREPARATION_MANIFEST.modules.map((m) =>
  `- ${m.title}: ${m.lessons.length} שיעורים`
).join("\n")}

## שאלות נפוצות
**מה זה אמירנט?**
אמירנט הוא מבחן אנגלית אקדמי של מאל"ו, נדרש לקבלה לאוניברסיטאות בישראל.

**כמה זמן ללמוד לאמירנט?**
בממוצע 2-4 שבועות של לימוד מסודר, 1-2 שעות ביום.

**האם אפשר לגשת שוב?**
כן, ניתן לגשת שלוש פעמים. הציון הטוב ביותר נשמר.

**מה ציון עובר?**
85 מתוך 100. חלק מהתכניות דורשות 95 ואף 100.

## קישורים מרכזיים
- דף הקורס: ${base}/prep/amirant
- כניסה לקורס: ${base}/prep/amirant/course
- תרגול: ${base}/prep/amirant/practice
- בלוג: ${base}/prep/blog
`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
