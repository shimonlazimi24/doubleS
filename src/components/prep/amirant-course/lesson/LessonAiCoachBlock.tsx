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

/** Human-facing chat text only — never dump RAG/system instructions into the UI. */
function buildHumanMessage(
  section: string,
  mode: "explain" | "summarize" | "example" | "drill2",
): string {
  const s = section.trim() || "החלק הנוכחי בשיעור";
  switch (mode) {
    case "explain":
      return `תסביר לי את החלק: «${s}»`;
    case "summarize":
      return `סכם לי בקצרה את: «${s}»`;
    case "example":
      return `תן לי עוד דוגמה על: «${s}»`;
    case "drill2":
      return `תן לי שתי שאלות תרגול קצרות על: «${s}»`;
    default:
      return `עזור לי עם: «${s}»`;
  }
}

/**
 * Calm “private coach” - opens the existing RAG chat with short human prefills.
 * Lesson context is already attached via activeLessonId on the chat panel.
 */
export function LessonAiCoachBlock({ lessonId: _lessonId, lastSectionTitle, className }: Props) {
  const s = lastSectionTitle;

  return (
    <div
      className={cn("rounded-2xl border border-slate-200/60 bg-paper/95 p-4 shadow-sm sm:p-5 [direction:rtl] [text-align:start] dark:border-slate-800/50", className)}
      lang="he"
    >
      <p className="text-sm font-semibold text-ink">מאמן אישי</p>
      <Text as="p" variant="caption" className="mt-0.5 text-muted">
        שאלו אותי על השיעור — בחירה מהירה:
      </Text>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() =>
            dispatchAmirantCourseCoach({ userMessage: buildHumanMessage(s ?? "", "explain"), autoSend: true })
          }
        >
          הסבר את החלק
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: buildHumanMessage(s ?? "", "summarize"), autoSend: true })}
        >
          סכם לי את החלק
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() =>
            dispatchAmirantCourseCoach({ userMessage: buildHumanMessage(s ?? "", "example"), autoSend: true })
          }
        >
          עוד דוגמה
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/50 text-xs sm:min-w-[7rem] sm:max-w-[11rem] sm:text-[0.8rem] sm:leading-tight"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: buildHumanMessage(s ?? "", "drill2"), autoSend: true })}
        >
          2 שאלות תרגול
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-slate-300/80 text-xs sm:min-w-[6rem] sm:max-w-[8rem] sm:leading-tight"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: buildHumanMessage(s ?? "", "explain"), autoSend: false })}
        >
          שאל את המאמן
        </Button>
      </div>
    </div>
  );
}
