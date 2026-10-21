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
  /** ברירת מחדל: שקופית קודמת — כדי לא להתבלבל עם ניווט מילים */
  prevLabel?: string;
  /** ברירת מחדל: המשך השיעור */
  nextLabel?: string;
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
  prevLabel = "שקופית קודמת",
  nextLabel = "המשך השיעור",
}: Props) {
  return (
    // ניווט תחתון גדול וברור: הקודם מימין (עם חץ ימינה), הבא/תרגול משמאל
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-stone-200/80 pt-5 [direction:rtl] [text-align:start]",
        sticky &&
          "max-lg:sticky max-lg:bottom-0 max-lg:z-20 max-lg:-mx-1 max-lg:bg-white/95 max-lg:px-2 max-lg:py-3 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-lg:backdrop-blur-md lg:static lg:bottom-auto",
        className,
      )}
      aria-label="ניווט בין שקופיות השיעור"
    >
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 min-w-[7.5rem] !rounded border-line bg-paper px-5 text-[15px] text-muted disabled:opacity-40"
        onClick={onPrev}
        disabled={!canPrev}
      >
        <span aria-hidden className="me-1.5">

        </span>
        {prevLabel}
      </Button>
      {canNext ? (
        <Button
          type="button"
          variant="primary"
          className="min-h-11 min-w-[9rem] !rounded px-6 text-[15px] font-bold"
          onClick={onNext}
        >
          {nextLabel}
          <span aria-hidden className="ms-1.5">

          </span>
        </Button>
      ) : isLast && practiceHref ? (
        <Link
          href={practiceHref}
          className="inline-flex min-h-11 min-w-[9rem] items-center justify-center rounded bg-primary px-8 text-[15px] font-bold text-white transition hover:bg-primary-hover"
        >
          עבור לתרגול
          <span aria-hidden className="ms-1.5">

          </span>
        </Link>
      ) : null}
    </div>
  );
}
