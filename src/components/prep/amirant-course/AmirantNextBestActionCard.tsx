import Link from "next/link";
import { Card, CardTitle, Text } from "@/components/ui";
import type { NextBestActionEnriched } from "@/lib/amirant-course/next-best-action";
import { cn } from "@/lib/design-system/cn";

type Props = {
  action: NextBestActionEnriched;
  className?: string;
};

const btnBase =
  "inline-flex min-h-[2.5rem] items-center justify-center rounded-control px-4 py-2.5 text-sm font-semibold shadow-card transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * "מה כדאי לעשות עכשיו" - CTA, למה, התקדמות, מומנטום, ושדרוג עדין כשאין גישה מלאה.
 */
export function AmirantNextBestActionCard({ action, className }: Props) {
  const { display, conversion, momentum, why, progressLine } = action;
  return (
    <Card className={cn("border-primary/20", className)} dir="rtl">
      <div className="flex flex-col gap-1">
        <CardTitle>מה כדאי לעשות עכשיו</CardTitle>
        <Text as="p" variant="bodySm" className="text-muted">
          {progressLine}
        </Text>
      </div>
      <Text as="p" variant="body" className="mt-2 font-semibold text-ink">
        {action.title}
      </Text>
      <Text as="p" variant="bodySm" className="mt-1.5 text-muted">
        {action.description}
      </Text>
      <div
        className="mt-3 rounded-control border border-primary/20 bg-surface-low/60 px-3 py-2.5"
        role="status"
        aria-label="למה מומלץ"
      >
        <Text as="p" variant="labelAccent" className="text-xs text-primary/90">
          למה עכשיו
        </Text>
        <Text as="p" variant="bodySm" className="mt-0.5 leading-relaxed text-ink/90">
          {why}
        </Text>
      </div>
      {momentum ? (
        <div className="mt-3 border-t border-line/50 pt-3">
          <Text as="p" variant="bodySm" className="text-muted">
            {momentum.line}
          </Text>
          <Link
            href={momentum.href}
            className="mt-1 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            {momentum.cta}
          </Link>
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Link
          href={display.primaryHref}
          className={cn(
            btnBase,
            "bg-primary text-white focus-visible:outline-primary/40",
            conversion?.primaryCtaIsUpgrade && "ring-1 ring-amber-500/30",
          )}
        >
          {display.primaryLabel}
        </Link>
        {display.secondaryHref && display.secondaryLabel ? (
          <Link
            href={display.secondaryHref}
            className={cn(
              btnBase,
              "border border-line bg-paper text-primary ring-1 ring-line/60 focus-visible:outline-line",
            )}
          >
            {display.secondaryLabel}
          </Link>
        ) : null}
      </div>
      {conversion && !conversion.primaryCtaIsUpgrade ? (
        <Text as="p" variant="bodySm" className="mt-3 max-w-prose text-muted/95">
          {conversion.subtleLine}
        </Text>
      ) : null}
    </Card>
  );
}
