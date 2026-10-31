"use client";

import { cn } from "@/lib/design-system/cn";
import { useAmirantCourseAssistantOptional } from "./AmirantCourseAssistantProvider";

/** The course header's "עוזר" control: a plain text button, underlined like an active tab while open. */
export function CourseNavAssistantButton() {
  const a = useAmirantCourseAssistantOptional();
  if (!a?.available) return null;
  return (
    <button
      type="button"
      id="amirant-course-assistant-toggle"
      onClick={a.toggle}
      aria-expanded={a.open}
      aria-controls="amirant-course-assistant"
      className={cn(
        "flex h-14 min-w-11 items-center justify-center border-b-2 px-1 text-sm transition-colors",
        a.open ? "border-primary font-bold text-primary" : "border-transparent font-medium text-muted hover:text-primary",
      )}
    >
      עוזר
    </button>
  );
}
