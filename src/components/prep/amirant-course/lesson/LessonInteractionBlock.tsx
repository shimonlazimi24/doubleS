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
 * Short pause between card groups: continue, ask the coach for a recap, or
 * go back over the cards. This is the slide's only coach prompt.
 */
export function LessonInteractionBlock({ onContinue, className, surface = "card" }: Props) {
  const helpMsg = "תן לי סיכום קצר של שלוש נקודות מהחלק האחרון בשיעור";

  const shell =
    surface === "embed"
      ? "border-t border-line pt-5 [direction:rtl] [text-align:start]"
      : "rounded-surface border border-line bg-paper p-6 [direction:rtl] [text-align:start] sm:p-8";
  return (
    <div className={cn(shell, className)} lang="he" role="status">
      <p className="text-base font-semibold text-ink sm:text-lg">בדיקה קצרה</p>
      <Text as="p" variant="bodySm" className="mt-2 text-base text-muted sm:text-lg">
        הכול ברור עד כאן? אפשר להמשיך, לקבל סיכום קצר מהמאמן, או לעבור שוב על החלק הזה.
      </Text>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2.5">
        <Button
          type="button"
          variant="primary"
          className="w-full min-h-[2.5rem] !rounded sm:w-auto sm:min-w-[7.5rem] sm:shrink-0"
          onClick={onContinue}
        >
          ברור, להמשיך
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full min-h-[2.5rem] !rounded border-line sm:w-auto sm:min-w-[9.5rem] sm:shrink-0"
          onClick={() => {
            dispatchAmirantCourseCoach({ userMessage: helpMsg, autoSend: true });
            onContinue();
          }}
        >
          סיכום קצר מהמאמן
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full min-h-[2.5rem] !rounded border-line sm:w-auto sm:min-w-[7.5rem] sm:shrink-0"
          onClick={() => {
            document.getElementById("amirant-lesson-pulse")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          לעבור שוב
        </Button>
      </div>
    </div>
  );
}
