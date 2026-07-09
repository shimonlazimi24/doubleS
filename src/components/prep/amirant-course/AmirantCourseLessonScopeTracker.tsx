"use client";

import { useEffect } from "react";

export const AMIRANT_LAST_LESSON_STORAGE_KEY = "amirant-course-last-lesson-id";

/**
 * שומר את מזהה השיעור האחרון - הצ'אט הגלובי משתמש בו כ־RAG context כשלא נמצאים בדף שיעור.
 */
export function AmirantCourseLessonScopeTracker({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    try {
      sessionStorage.setItem(AMIRANT_LAST_LESSON_STORAGE_KEY, lessonId);
    } catch {
      /* private mode / quota */
    }
  }, [lessonId]);
  return null;
}
