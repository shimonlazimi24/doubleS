"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import {
  getCourseModuleOrdinal,
  getModuleByLessonId,
  getOutlineLessonVisualKind,
  unitHeadingLineForLessonSidebar,
  type SidebarNextLessonProps,
} from "@/lib/amirant-course";
import { useAmirantCourseProgress } from "../AmirantCourseProgressProvider";
import { cn } from "@/lib/design-system/cn";
import { PREP_BASE } from "@/lib/prep/constants";
import { CourseOutlineProgress } from "./CourseOutlineProgress";
import { CourseOutlineUnit } from "./CourseOutlineUnit";
import type { BuiltWorkspaceStep } from "../lesson-workspace/workspace-step";

const LESSON_PREFIX = `${PREP_BASE}/amirant/course/lesson`;

type Props = {
  lessonId: string;
  courseHomeHref: string;
  steps: BuiltWorkspaceStep[];
  activeIndex: number;
  completedIndices: Set<number>;
  onSelectStep: (index: number) => void;
  nextInSequence?: SidebarNextLessonProps | null;
  className?: string;
  variant?: "panel" | "drawer";
  onRequestClose?: () => void;
};

/**
 * Current module only: unit header, unit progress, this module’s lessons, steps for the active lesson.
 * Light stone/white surface; no other units and no full-course list.
 */
export function CourseOutlineSidebar({
  lessonId,
  courseHomeHref,
  steps,
  activeIndex,
  completedIndices,
  onSelectStep,
  nextInSequence,
  className,
  variant = "panel",
  onRequestClose,
}: Props) {
  const { getLessonStatus, getModuleProgress } = useAmirantCourseProgress();
  const hit = useMemo(() => getModuleByLessonId(lessonId), [lessonId]);

  const lessonHref = useCallback((id: string) => `${LESSON_PREFIX}/${id}`, []);
  const isDrawer = variant === "drawer";

  if (!hit) {
    return (
      <aside
        className={cn(
          "flex min-h-0 w-full min-w-0 max-w-[26rem] flex-col border-stone-200/80 bg-white/95 p-4 [direction:rtl] [text-align:start]",
          className,
        )}
        lang="he"
        dir="rtl"
      >
        <p className="text-sm text-slate-600">לא נמצאה יחידה עבור שיעור זה.</p>
      </aside>
    );
  }

  const { module } = hit;
  const moduleOrdinal = getCourseModuleOrdinal(module.id);
  const unitLine = unitHeadingLineForLessonSidebar(module, moduleOrdinal);
  const mp = getModuleProgress(module);

  const lessonModels = module.lessons.map((lesson, indexInModule) => ({
    lesson,
    moduleOrdinal,
    indexInModule,
    visualKind: getOutlineLessonVisualKind(lesson, module),
    status: getLessonStatus(lesson.id),
  }));

  return (
    <aside
      className={cn(
        "flex min-h-0 w-full min-w-0 max-w-[26rem] flex-col self-stretch border-stone-200/80 bg-gradient-to-b from-stone-50/95 to-white text-slate-800 shadow-[inset_1px_0_0_rgba(15,35,71,0.06)] [direction:rtl] [text-align:start]",
        isDrawer ? "max-h-[100dvh] rounded-none" : "min-h-[min(100dvh,100vh)]",
        className,
      )}
      lang="he"
      dir="rtl"
    >
      {isDrawer && onRequestClose ? (
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/90 px-3 py-2.5">
          <span className="text-sm font-semibold text-[#0f2347]">היחידה הנוכחית</span>
          <button
            type="button"
            onClick={onRequestClose}
            className="flex h-9 min-w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-stone-100 hover:text-sky-900"
            aria-label="סגור"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}

      <div className={cn("flex min-h-0 flex-1 flex-col", isDrawer ? "px-3 pb-4 pt-2" : "px-4 pb-4 pt-4")}>
        <CourseOutlineProgress
          unitHeadingLine={unitLine}
          percentInUnit={mp.percent}
          completedInUnit={mp.completed}
          totalInUnit={mp.total}
          courseHomeHref={courseHomeHref}
          compact={isDrawer}
          className="shrink-0"
        />

        <nav className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pe-0.5 [-webkit-overflow-scrolling:touch]" aria-label="שיעורי היחידה">
          <CourseOutlineUnit
            module={module}
            completedInUnit={mp.completed}
            totalInUnit={mp.total}
            lessons={lessonModels}
            lessonHref={lessonHref}
            currentLessonId={lessonId}
            steps={steps}
            activeStepIndex={activeIndex}
            completedStepIndices={completedIndices}
            onSelectStep={onSelectStep}
          />
        </nav>

        {nextInSequence ? (
          <div className="mt-3 shrink-0 border-t border-stone-200/80 pt-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{nextInSequence.scopeEyebrow}</p>
            <p className="mt-1.5 text-[0.8125rem] font-semibold leading-snug text-[#0f2347]">{nextInSequence.lessonTitle}</p>
            <Link
              href={nextInSequence.href}
              className="mt-2 flex min-h-9 w-full items-center justify-center rounded-lg border border-sky-800/20 bg-sky-50/80 px-3 text-center text-sm font-medium text-sky-950 transition hover:border-sky-800/35 hover:bg-sky-50"
            >
              המשך לשיעור הבא
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
