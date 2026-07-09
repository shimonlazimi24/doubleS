import { Button } from "@/components/ui/button";
import { dispatchAmirantCourseCoach } from "@/lib/prep/amirant-lesson-coach-events";
import { cn } from "@/lib/design-system/cn";

type Props = { className?: string };

const MSG =
  "צריך/ה הסבר נוסף - נא להשיב **בהתאם בלבד לרקע השיעור (RAG)** - בלי הזכייה בחומר.";

/**
 * Subtle, single row - not the full coach surface.
 */
export function LessonAiBlock({ className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-gray-200 bg-stone-50/50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 [direction:rtl] [text-align:start]",
        className,
      )}
      lang="he"
    >
      <p className="text-sm text-gray-600">צריך הסבר נוסף?</p>
      <Button
        type="button"
        variant="secondary"
        className="h-9 w-full rounded-xl border-gray-200 text-xs sm:w-auto sm:shrink-0"
        onClick={() => dispatchAmirantCourseCoach({ userMessage: MSG, autoSend: true })}
      >
        שאל את ה-AI
      </Button>
    </div>
  );
}
