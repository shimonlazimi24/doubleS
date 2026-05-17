"use client";

import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";
import type { ManifestModule } from "@/lib/amirant-course/types/course-manifest";

type Props = {
  module: ManifestModule;
  /** שם מוצג (עברית) */
  moduleTitleHe: string;
  className?: string;
};

/**
 * מד השלמה לשיעורי המודול שבו נמצאים (רק אם יש `lessons` במניפסט).
 */
export function AmirantModuleProgressCard({ module, moduleTitleHe, className }: Props) {
  const { getModuleProgress } = useAmirantCourseProgress();
  const m = getModuleProgress(module);
  if (m.total === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        "mb-4 rounded-2xl border border-line/60 bg-paper/95 px-4 py-3 shadow-sm [direction:rtl] [text-align:start]",
        className,
      )}
      role="region"
      aria-label={`התקדמות במודול ${moduleTitleHe}`}
    >
      <Text as="p" variant="caption" className="font-medium text-ink">
        במודול &quot;{moduleTitleHe}&quot;: {m.completed}/{m.total} שיעורים · {m.percent}%
      </Text>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-low ring-1 ring-line/30">
        <div
          className="h-full min-w-0 rounded-full bg-primary/80 transition-[width] duration-300"
          style={{ width: `${Math.min(100, Math.max(0, m.percent))}%` }}
        />
      </div>
    </div>
  );
}
