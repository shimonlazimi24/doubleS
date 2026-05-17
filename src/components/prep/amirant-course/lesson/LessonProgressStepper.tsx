import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

export type StepperItem = { id: string; label: string; kind: "section" | "gate" };

type Props = {
  items: StepperItem[];
  /** 1-based count of items currently revealed in progressive mode */
  revealedCount: number;
  viewAll: boolean;
  started: boolean;
  mode: "markdown" | "blocks" | "vocab";
  className?: string;
  /** `horizontal` = mobile rail; `vertical` = desktop sidebar */
  layout: "horizontal" | "vertical";
};

/**
 * Calm path overview — not a game map; shows where you are in the micro-flow.
 */
export function LessonProgressStepper({
  items,
  revealedCount,
  viewAll,
  started,
  mode,
  className,
  layout,
}: Props) {
  if (mode === "vocab" || items.length === 0) {
    return null;
  }

  const total = items.length;
  const activeIndex = !started ? -1 : viewAll ? total - 1 : Math.max(0, Math.min(revealedCount - 1, total - 1));
  const pct = !started ? 0 : viewAll ? 100 : total > 0 ? Math.min(100, Math.round((revealedCount / total) * 100)) : 0;
  const allDone = started && viewAll;

  if (layout === "horizontal") {
    return (
      <div
        className={cn("rounded-2xl border border-line/50 bg-paper/90 px-3 py-2.5 shadow-sm [direction:rtl] lg:hidden", className)}
        lang="he"
      >
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-low/80">
          <div
            className="h-full rounded-full bg-primary/80 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <Text as="p" variant="caption" className="text-center text-xs text-muted">
          {activeIndex < 0 ? "לפני תחילה" : `שלב ${activeIndex + 1} מתוך ${total}`}
        </Text>
      </div>
    );
  }

  return (
    <nav
      className={cn("rounded-2xl border border-line/50 bg-paper/95 p-4 shadow-sm [direction:rtl] [text-align:start]", className)}
      lang="he"
      aria-label="מסלול השיעור"
    >
      <p className="text-[0.7rem] font-medium text-muted">מסלול</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">התקדמות</p>
      <ol className="mt-4 space-y-2.5">
        {items.map((s, i) => {
          const done = allDone || (started && !viewAll && i < activeIndex);
          const current = started && !viewAll && i === activeIndex;
          const isGate = s.kind === "gate";
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-start gap-2 rounded-lg border border-transparent py-1.5 pe-1 text-sm transition-colors",
                current && "border-primary/25 bg-primary/[0.05] text-ink",
                done && !current && "text-muted",
                !done && !current && "text-muted/80",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-medium",
                  done && "bg-primary/15 text-primary",
                  current && "bg-primary text-white",
                  !done && !current && "bg-surface-low/80 text-muted",
                )}
                aria-hidden
              >
                {done && !current ? "✓" : i + 1}
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                {isGate ? "בדיקה קצרה" : s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
