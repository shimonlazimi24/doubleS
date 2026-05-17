"use client";

import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

/**
 * מד השלמת שיעורים בקורס — דף קורס ועמודי מודול (למעלה), לא בעמוד שיעור בודד.
 */
export function AmirantCourseOverallProgress({ className }: { className?: string }) {
  const p = useAmirantCourseProgress();
  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border border-line/60 bg-paper/95 px-4 py-3 shadow-sm [direction:rtl] [text-align:start]",
        className,
      )}
      role="region"
      aria-label="התקדמות בקורס"
    >
      <Text as="p" variant="caption" className="font-medium text-ink">
        התקדמות בקורס: {p.completedLessons}/{p.totalLessons} שיעורים · {p.percentComplete}%
      </Text>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-low ring-1 ring-line/30">
        <div
          className="h-full min-w-0 rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, p.percentComplete))}%` }}
        />
      </div>
    </div>
  );
}
