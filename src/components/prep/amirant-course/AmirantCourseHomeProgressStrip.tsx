"use client";

import { Text } from "@/components/ui";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";

export function AmirantCourseHomeProgressStrip() {
  const { completedLessons, totalLessons, percentComplete } = useAmirantCourseProgress();
  return (
    <Text as="p" variant="bodySm" className="mt-4 text-muted">
      התקדמות בקורס: {completedLessons} מתוך {totalLessons} שיעורים הושלמו ({percentComplete}%).
    </Text>
  );
}
