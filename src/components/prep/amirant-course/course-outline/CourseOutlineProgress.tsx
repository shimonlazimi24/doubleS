"use client";

import Link from "next/link";
import { cn } from "@/lib/design-system/cn";

type Props = {
  /** Full line e.g. «יחידה 1: פתיחה והיכרות» */
  unitHeadingLine: string;
  /** Progress within the current unit only (not whole course). */
  percentInUnit: number;
  completedInUnit: number;
  totalInUnit: number;
  courseHomeHref?: string | null;
  className?: string;
  /** Slightly denser when embedded in mobile drawer. */
  compact?: boolean;
};

/**
 * Unit-scoped progress: header + fraction + bar. Light surface; aligned with lesson main column.
 */
export function CourseOutlineProgress({
  unitHeadingLine,
  percentInUnit,
  completedInUnit,
  totalInUnit,
  courseHomeHref,
  className,
  compact,
}: Props) {
  const pct = Math.max(0, Math.min(100, percentInUnit));
  return (
    <div className={cn("border-b border-stone-200/90 pb-3", className)}>
      {courseHomeHref ? (
        <Link
          href={courseHomeHref}
          className="block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-sky-900"
        >
          לעמוד הקורס
        </Link>
      ) : null}
      <h2 className={cn("font-semibold leading-snug text-[#0f2347]", compact ? "mt-1 text-sm" : "mt-1.5 text-base")}>
        {unitHeadingLine}
      </h2>
      <div className={cn("mt-2 flex items-baseline justify-between gap-2", compact && "mt-1.5")}>
        <span className="text-2xl font-bold tabular-nums text-sky-900">{pct}%</span>
        <span className="text-xs tabular-nums text-slate-600">
          {completedInUnit}/{totalInUnit} ביחידה
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200/90"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-sky-800 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
