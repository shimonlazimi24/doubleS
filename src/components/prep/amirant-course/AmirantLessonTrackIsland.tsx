"use client";

import { useEffect } from "react";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import { Text } from "@/components/ui";
import { cn } from "@/lib/design-system/cn";

type Props = { lessonId: string; lessonTitle: string; className?: string };

/**
 * Marks a lesson as started on mount, and offers explicit completion (avoids false positives).
 */
export function AmirantLessonTrackIsland({ lessonId, lessonTitle, className }: Props) {
  const { markLessonStarted, markLessonCompleted, getLessonStatus } = useAmirantCourseProgress();

  useEffect(() => {
    markLessonStarted(lessonId);
  }, [lessonId, markLessonStarted]);

  const done = getLessonStatus(lessonId) === "completed";

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end", className)}>
      {done ? (
        <Text as="p" variant="caption" className="whitespace-nowrap font-medium text-emerald-700">
          ✓ הושלם
        </Text>
      ) : (
        <button
          type="button"
          onClick={() => markLessonCompleted(lessonId)}
          className="whitespace-nowrap rounded-full border border-line/80 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary"
        >
          סימון כהושלם
        </button>
      )}
      <span className="sr-only">{lessonTitle}</span>
    </div>
  );
}
