import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import { dispatchAmirantCourseCoach } from "@/lib/prep/amirant-lesson-coach-events";

type Props = {
  onContinue: () => void;
  className?: string;
  surface?: "card" | "embed";
};

/**
 * Short reflection between card groups - three clear options, not gamified.
 */
export function LessonInteractionBlock({ onContinue, className, surface = "card" }: Props) {
  const helpMsg =
    "רקע: בדיקת הבנה אמצעית בשיעור. בקש/י: תמצית של שלושה משפטים **מבוססי מקור בלבד (RAG)** לליבת הנקודות, בלי מספרי בחינה או עובדות שאינן בחומר.";

  const shell =
    surface === "embed"
      ? "rounded-xl bg-stone-50/70 p-5 [direction:rtl] [text-align:start] ring-1 ring-inset ring-gray-200/40 sm:p-6"
      : "rounded-2xl border border-gray-200 bg-stone-50/60 p-6 shadow-sm [direction:rtl] [text-align:start] sm:p-8";
  return (
    <div className={cn(shell, className)} lang="he" role="status">
      <p className="text-base font-semibold text-gray-900 sm:text-lg">בדיקה קצרה</p>
      <Text as="p" variant="bodySm" className="mt-2 text-base text-gray-600 sm:mt-3 sm:text-lg">
        איך נוח לך/לך לעבור הלאה מהקטעים שקראת/י?
      </Text>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2.5">
        <Button
          type="button"
          variant="primary"
          className="w-full min-h-[2.5rem] rounded-xl sm:w-auto sm:min-w-[7.5rem] sm:shrink-0"
          onClick={onContinue}
        >
          ברור, להמשיך
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full min-h-[2.5rem] rounded-xl border-gray-200 sm:w-auto sm:min-w-[9.5rem] sm:shrink-0"
          onClick={() => {
            dispatchAmirantCourseCoach({ userMessage: helpMsg, autoSend: true });
            onContinue();
          }}
        >
          בקשה קצרה ממאמן
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full min-h-[2.5rem] rounded-xl border-gray-200 sm:w-auto sm:min-w-[7.5rem] sm:shrink-0"
          onClick={() => {
            document.getElementById("amirant-lesson-pulse")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          לסקור שוב
        </Button>
      </div>
    </div>
  );
}
