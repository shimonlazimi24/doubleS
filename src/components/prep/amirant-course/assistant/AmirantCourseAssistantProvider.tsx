"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAmirantCourseAccess } from "../AmirantCourseAccessProvider";
import { AMIRANT_LAST_LESSON_STORAGE_KEY } from "../AmirantCourseLessonScopeTracker";
import { getPrepShowCourseAssistant } from "@/lib/prep/prep-full-access";
import { AMIRANT_COURSE_COACH_EVENT } from "@/lib/prep/amirant-lesson-coach-events";
import { isContextualCoursePath, lessonIdFromPath } from "@/lib/prep/amirant-course-assistant/chat-client";
import { useAssistantChat, type AssistantChat } from "./use-assistant-chat";

type AssistantApi = {
  /** Paid learner (or dev flag) on a page with content to talk about. */
  available: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Lesson id for RAG: the open lesson, else the last one opened this session. */
  activeLessonId: string | null;
  /** True when the open lesson itself is on screen (vs. a remembered one). */
  lessonOnScreen: boolean;
  chat: AssistantChat;
};

const Ctx = createContext<AssistantApi | null>(null);

/**
 * Owns the assistant's open state and the conversation for every page under
 * /course, so the thread survives navigation between lessons and closing the
 * sheet. The chat route still enforces access on its own.
 */
export function AmirantCourseAssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { hasFullAccess } = useAmirantCourseAccess();
  const [open, setOpen] = useState(false);
  const [lastLesson, setLastLesson] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLastLesson(sessionStorage.getItem(AMIRANT_LAST_LESSON_STORAGE_KEY));
    } catch {
      /* private mode */
    }
  }, [pathname]);

  // A lesson block asking for help opens the assistant.
  useEffect(() => {
    const onCoach = () => setOpen(true);
    window.addEventListener(AMIRANT_COURSE_COACH_EVENT, onCoach);
    return () => window.removeEventListener(AMIRANT_COURSE_COACH_EVENT, onCoach);
  }, []);

  const urlLesson = useMemo(() => lessonIdFromPath(pathname), [pathname]);
  const activeLessonId = urlLesson ?? lastLesson;
  const available = (getPrepShowCourseAssistant() || hasFullAccess) && isContextualCoursePath(pathname);
  const chat = useAssistantChat({ activeLessonId, pathname });
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const value = useMemo<AssistantApi>(
    () => ({ available, open: open && available, setOpen, toggle, activeLessonId, lessonOnScreen: Boolean(urlLesson), chat }),
    [available, open, toggle, activeLessonId, urlLesson, chat],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAmirantCourseAssistant(): AssistantApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAmirantCourseAssistant outside AmirantCourseAssistantProvider");
  return v;
}

export function useAmirantCourseAssistantOptional(): AssistantApi | null {
  return useContext(Ctx);
}
