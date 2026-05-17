import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system/cn";

type Props = { onOpenAssistant: () => void; className?: string };

export function LessonAiNudge({ onOpenAssistant, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-line/50 bg-paper/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between [direction:rtl] [text-align:start]",
        className,
      )}
      lang="he"
    >
      <div>
        <p className="text-sm font-medium text-ink">צריך הסבר נוסף?</p>
        <p className="mt-0.5 text-xs text-muted">עוזר הקורס משתמש בהקשר השיעור הנוכחי — בלי לדרוש מעבר בין מסכים.</p>
      </div>
      <Button type="button" variant="secondary" className="shrink-0 border border-line/60 text-sm" onClick={onOpenAssistant}>
        פתח שיחה
      </Button>
    </div>
  );
}
