import { Text } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system/cn";
import { dispatchAmirantCourseCoach } from "@/lib/prep/amirant-lesson-coach-events";

type Props = {
  lessonId: string;
  /** Most recent content section the learner has reached (for prompt grounding). */
  lastSectionTitle: string | null;
  className?: string;
};

function buildPrompt(lessonId: string, section: string, mode: "explain" | "summarize" | "example" | "drill2"): string {
  const s = section.trim() || "השיעור הנוכחי (ללא כותרת משנה — השתמש/י בקטעי המקור ב־RAG).";
  const base = `שיעור (מזהה): ${lessonId}. הפרד בין “הסבר מהמקור” לבין “המלצה אישית” אם יש. אל תייצר עובדות, ציונים, או שאלות אמיתיות ממבחנים. התבסס/י **רק** על קטעי הקורס (RAG). `;
  switch (mode) {
    case "explain":
      return `${base}הסבר/י ב-4–6 משפטים, בשפה בוגרת, את המוקד: «${s}»`;
    case "summarize":
      return `${base}תן/י 3–4 bullet קצרים: סיכום «${s}»`;
    case "example":
      return `${base}הוסף/י 1–2 משפטי דוגמה, בהתאם לסגנון הקורס, עבור «${s}» (לא חוברות חיצוניות).`;
    case "drill2":
      return `${base}הצע/י שתי **שאלות תרגול לדוגמה בלבד** (לא ממבחן אמיתי), ברמת A2–B1, סביב «${s}». הוסף/י: “השאלות להמחשה בלבד — לא הועתקו ממבחן.”`;
    default:
      return base;
  }
}

/**
 * Calm “private coach” — opens the existing RAG chat with action-oriented prefills.
 */
export function LessonAiCoachBlock({ lessonId, lastSectionTitle, className }: Props) {
  const s = lastSectionTitle;

  return (
    <div
      className={cn("rounded-2xl border border-slate-200/60 bg-paper/95 p-4 shadow-sm sm:p-5 [direction:rtl] [text-align:start] dark:border-slate-800/50", className)}
      lang="he"
    >
      <p className="text-sm font-semibold text-ink">מאמן AI</p>
      <Text as="p" variant="caption" className="mt-0.5 text-muted">
        שאל/י את המאמן (ההקשר הוא שיעור פתוח, עם RAG). בחירה מהירה:
      </Text>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() =>
            dispatchAmirantCourseCoach({ userMessage: buildPrompt(lessonId, s ?? "", "explain"), autoSend: true })
          }
        >
          הסבר את החלק
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: buildPrompt(lessonId, s ?? "", "summarize"), autoSend: true })}
        >
          סכם לי את החלק
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() =>
            dispatchAmirantCourseCoach({ userMessage: buildPrompt(lessonId, s ?? "", "example"), autoSend: true })
          }
        >
          עוד דוגמה
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: buildPrompt(lessonId, s ?? "", "drill2"), autoSend: true })}
        >
          2 שאלות תרגול
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-slate-300/80 text-xs sm:min-w-[6rem] sm:max-w-[8rem] sm:leading-tight"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: buildPrompt(lessonId, s ?? "", "explain"), autoSend: false })}
        >
          שאל את המאמן
        </Button>
      </div>
      <p className="mt-2 text-[0.65rem] text-muted">“צריך הסבר נוסף” גם בבדיקות — עוזר רקע נשלח בצ’אט (מקור בקורס).</p>
    </div>
  );
}
