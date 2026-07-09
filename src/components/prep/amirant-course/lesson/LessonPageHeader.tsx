import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

type Props = {
  kindLabel: string;
  title: string;
  showProgress: boolean;
  started: boolean;
  currentStep: number;
  totalSteps: number;
  pathProgressPercent: number;
  className?: string;
};

/**
 * Top page chrome: title, step counter, progress bar - not the hero (see `LessonHeroCard`).
 */
export function LessonPageHeader({
  kindLabel,
  title,
  showProgress,
  started,
  currentStep,
  totalSteps,
  pathProgressPercent,
  className,
}: Props) {
  const p = Math.max(0, Math.min(100, pathProgressPercent));

  return (
    <header
      className={cn("mb-6 w-full [direction:rtl] [text-align:start] sm:mb-8", className)}
      lang="he"
    >
      <Text as="p" variant="caption" className="text-xs font-medium text-slate-500">
        שיעור · {kindLabel}
      </Text>
      <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {showProgress && totalSteps > 0 ? (
        <div className="mt-4 w-full max-w-2xl">
          <p className="text-sm font-medium text-slate-600" aria-live="polite">
            {started && currentStep > 0
              ? `שלב ${Math.min(currentStep, totalSteps)} מתוך ${totalSteps}`
              : `מסלול: ${totalSteps} חלקים`}
          </p>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200/90"
            role="progressbar"
            aria-valuenow={p}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="התקדמות בטעינת חלקי השיעור"
          >
            <div
              className="h-full rounded-full bg-slate-700 transition-[width] duration-500 ease-out"
              style={{ width: `${p}%` }}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
