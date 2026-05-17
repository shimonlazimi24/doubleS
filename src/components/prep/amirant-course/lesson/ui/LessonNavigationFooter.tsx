import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/design-system/cn";

type Props = {
  canPrev: boolean;
  canNext: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  practiceHref: string | null;
  className?: string;
  sticky?: boolean;
};

/**
 * Sticky (mobile) or inline (desktop) step navigation; matches primary/secondary button rules.
 */
export function LessonNavigationFooter({
  canPrev,
  canNext,
  isLast,
  onPrev,
  onNext,
  practiceHref,
  className,
  sticky = true,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 [direction:rtl] [text-align:start] sm:flex-row sm:items-center sm:justify-between",
        sticky &&
          "max-lg:sticky max-lg:bottom-0 max-lg:z-20 max-lg:-mx-1 max-lg:border-t max-lg:border-stone-200/90 max-lg:bg-white/95 max-lg:px-2 max-lg:py-3 max-lg:pb-[max(0.65rem,env(safe-area-inset-bottom))] max-lg:backdrop-blur-md lg:static lg:bottom-auto",
        "lg:mt-0 lg:border-t lg:border-stone-200/70 lg:pt-3 lg:pb-0",
        !sticky && "mt-2 sm:mt-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 min-w-[6.75rem] rounded-lg border-stone-200 bg-white px-4 text-[0.9375rem] text-slate-800 shadow-sm sm:min-h-9"
          onClick={onPrev}
          disabled={!canPrev}
        >
          קודם
        </Button>
        {canNext ? (
          <Button
            type="button"
            variant="primary"
            className="min-h-10 min-w-[6.75rem] rounded-lg px-4 text-[0.9375rem] shadow-sm sm:min-h-9"
            onClick={onNext}
          >
            הבא
          </Button>
        ) : null}
      </div>
      {isLast && practiceHref ? (
        <Link
          href={practiceHref}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-800/25 bg-white px-4 text-sm font-medium text-sky-900 transition hover:border-sky-800/40 hover:bg-sky-50/80"
        >
          עבור לתרגול
        </Link>
      ) : null}
    </div>
  );
}
