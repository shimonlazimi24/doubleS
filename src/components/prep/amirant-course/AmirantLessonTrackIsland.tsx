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
        <Text as="p" variant="caption" className="text-emerald-800">
          שיעור הושלם
        </Text>
      ) : (
        <button
          type="button"
          onClick={() => markLessonCompleted(lessonId)}
          className="rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"
        >
          סימון שיעור כהושלם
        </button>
      )}
      <span className="sr-only">{lessonTitle}</span>
    </div>
  );
}
