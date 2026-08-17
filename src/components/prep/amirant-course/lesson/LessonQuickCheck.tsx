import { Text } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system/cn";
import { dispatchAmirantCourseCoach } from "@/lib/prep/amirant-lesson-coach-events";

type Props = {
  onContinue: () => void;
  onNeedHelpMessage?: string;
  className?: string;
};

/**
 * Short interaction between micro-sections: light, professional, not scored.
 */
export function LessonQuickCheck({ onContinue, onNeedHelpMessage, className }: Props) {
  const needHelp = onNeedHelpMessage ?? "צריך הסבר נוסף על החלק האחרון בשיעור";

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-slate-50/40 px-4 py-5 sm:px-5 [direction:rtl] [text-align:start] dark:border-slate-700/50 dark:bg-slate-900/20",
        className,
      )}
      role="status"
      lang="he"
    >
      <p className="text-sm font-medium text-ink">בדיקה קצרה</p>
      <Text as="p" variant="bodySm" className="mt-2 text-muted">
        איך הולך? אפשר לסמן שההמשך מובן, או לבקש הסבר קצר מהמאמן.
      </Text>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-2">
        <Button type="button" variant="primary" className="flex-1" onClick={onContinue}>
          הבנתי, להמשיך
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="flex-1 border border-line/60"
          onClick={() => dispatchAmirantCourseCoach({ userMessage: needHelp, autoSend: true })}
        >
          צריך הסבר נוסף
        </Button>
      </div>
    </div>
  );
}
