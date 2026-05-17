"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AMIRANT_LAST_LESSON_STORAGE_KEY } from "./AmirantCourseLessonScopeTracker";
import { AmirantCourseChatPanel } from "./AmirantCourseChatPanel";
import { AMIRANT_COURSE_COACH_EVENT } from "@/lib/prep/amirant-lesson-coach-events";

/**
 * עוזר AI: פאנל צף + כפתור. **נרקע מ־layout** לפי `getPrepShowCourseAssistant()` (תשלום או `next dev`).
 */
export function AmirantCourseFloatingChat() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(true);
  const [lastLesson, setLastLesson] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLastLesson(sessionStorage.getItem(AMIRANT_LAST_LESSON_STORAGE_KEY));
    } catch {
      /* */
    }
  }, [pathname]);

  useEffect(() => {
    const onCoach = () => setOpen(true);
    window.addEventListener(AMIRANT_COURSE_COACH_EVENT, onCoach);
    return () => window.removeEventListener(AMIRANT_COURSE_COACH_EVENT, onCoach);
  }, []);

  const urlLesson = useMemo(() => {
    const m = pathname.match(/\/prep\/amirant\/course\/lesson\/([^/]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const activeLessonId = urlLesson ?? lastLesson;

  const contextHint = useMemo(() => {
    if (urlLesson) return "מיקוד: שיעור בדף זה (הקשר מדויק).";
    if (lastLesson) return "מיקוד: אחרון שיעור — לעומק יותר פתחו את השיעור.";
    return "מיקוד: כלל הקורס. לתשובות ממוקדות, היכנסו לשיעור.";
  }, [urlLesson, lastLesson]);

  return (
    <>
      {open ? (
        <div
          dir="ltr"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex max-h-[100dvh] items-end justify-end p-3 pb-20 sm:p-4 sm:pb-5"
        >
          <div className="pointer-events-auto w-full max-w-md">
            <AmirantCourseChatPanel
              compact
              activeLessonId={activeLessonId}
              contextHint={contextHint}
              title="עוזר הקורס"
            />
          </div>
        </div>
      ) : null}

      <button
        id="amirant-course-assistant-toggle"
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed z-[60] flex h-14 min-w-[3.5rem] items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-lg ring-2 ring-paper transition hover:bg-primary/90"
        style={{
          bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          right: "max(1rem, env(safe-area-inset-right, 0px))",
          left: "auto",
        }}
        aria-expanded={open}
        aria-label={open ? "מזעור עוזר הקורס" : "פתח עוזר הקורס"}
      >
        {open ? "×" : "עוזר"}
      </button>
    </>
  );
}
