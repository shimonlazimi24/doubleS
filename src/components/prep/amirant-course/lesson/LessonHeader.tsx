import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

type Props = {
  kindLabel: string;
  title: string;
  estimatedMinutes: number | null;
  intro: string;
  showFlowControls: boolean;
  started: boolean;
  viewAll: boolean;
  onStart: () => void;
  onToggleViewAll: () => void;
  progressLabel: string | null;
  defaultIntroFallback: string;
  /** 0–100: lesson path progress in progressive (non “show all”) mode */
  pathProgressPercent: number;
  showPathProgress: boolean;
};

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

/**
 * Calm, premium hero - typography-first, no playful gradients.
 */
export function LessonHeader({
  kindLabel,
  title,
  estimatedMinutes,
  intro,
  showFlowControls,
  started,
  viewAll,
  onStart,
  onToggleViewAll,
  progressLabel,
  defaultIntroFallback,
  pathProgressPercent,
  showPathProgress,
}: Props) {
  const blurb = intro || defaultIntroFallback;

  return (
    <header className={cn("rounded-2xl border border-line/50 bg-paper p-6 shadow-sm sm:p-8", "[text-align:start] [direction:rtl]")} lang="he">
      <Text as="p" variant="caption" className="text-[0.75rem] font-medium text-muted">
        שיעור · {kindLabel}
      </Text>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink md:text-3xl lg:text-4xl">{title}</h1>
      {estimatedMinutes != null ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line/60 bg-surface-low/40 px-2.5 py-1 text-xs font-medium text-muted">
          <ClockIcon className="h-3.5 w-3.5 opacity-80" />
          <span>כ־{estimatedMinutes} דק׳</span>
        </p>
      ) : null}
      <p className="mt-4 max-w-[40rem] text-base leading-[1.65] text-ink/90 [text-wrap:pretty] sm:max-w-[45rem] sm:text-lg">{blurb}</p>
      {showPathProgress && showFlowControls && started && !viewAll ? (
        <div className="mt-4 w-full max-w-md">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800/50">
            <div
              className="h-full rounded-full bg-primary/90 transition-[width] duration-500"
              style={{ width: `${Math.max(0, Math.min(100, pathProgressPercent))}%` }}
            />
          </div>
        </div>
      ) : null}
      {showFlowControls ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!started ? (
            <Button type="button" variant="primary" className="min-w-[6.5rem] px-6 py-2.5 text-sm font-medium" onClick={onStart}>
              התחל שיעור
            </Button>
          ) : null}
          <Button type="button" variant="secondary" className="border border-line/70 bg-paper text-sm" onClick={onToggleViewAll}>
            {viewAll ? "מצב שלב-אחר-שלב" : "הצג הכל"}
          </Button>
          {progressLabel ? (
            <Text as="span" variant="caption" className="text-muted">
              {progressLabel}
            </Text>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
