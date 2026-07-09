"use client";

import { useCallback, useEffect, useState } from "react";
import type { ManifestLesson, ManifestModule } from "@/lib/amirant-course/types/course-manifest";
import type { LessonProgressStatus } from "@/lib/amirant-course/progress-calculations";
import { lessonUsesOutlineSubstepAccordion } from "@/lib/amirant-course/course-outline-visual-kind";
import type { OutlineLessonVisualKind } from "@/lib/amirant-course/course-outline-visual-kind";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CourseOutlineLessonAccordion, type LessonOutlineChrome } from "./CourseOutlineLessonAccordion";
import type { BuiltWorkspaceStep } from "../lesson-workspace/workspace-step";

type LessonRowModel = {
  lesson: ManifestLesson;
  moduleOrdinal: number;
  indexInModule: number;
  visualKind: OutlineLessonVisualKind;
  status: LessonProgressStatus;
};

type Props = {
  module: ManifestModule;
  completedInUnit: number;
  totalInUnit: number;
  lessons: LessonRowModel[];
  lessonHref: (lessonId: string) => string;
  currentLessonId: string;
  steps: BuiltWorkspaceStep[];
  activeStepIndex: number;
  completedStepIndices: Set<number>;
  onSelectStep: (index: number) => void;
};

function outlineChromeForLesson(lesson: ManifestLesson, module: ManifestModule, isCurrent: boolean, stepCount: number): LessonOutlineChrome {
  const uses = lessonUsesOutlineSubstepAccordion(lesson, module);
  if (!uses) return "play";
  if (isCurrent && stepCount <= 1) return "none";
  return "chevron";
}

/**
 * שיעורי מבחן (מזוהי quiz במניפסט) - play; שיעור עם 2+ שלבים - צ'ברון+אקורדיון; שלב בודד - בלי בקרה מובילה.
 */
export function CourseOutlineUnit({
  module,
  completedInUnit,
  totalInUnit,
  lessons,
  lessonHref,
  currentLessonId,
  steps,
  activeStepIndex,
  completedStepIndices,
  onSelectStep,
}: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  useEffect(() => {
    const row = lessons.find((r) => r.lesson.id === currentLessonId);
    if (!row) {
      setOpenLessonId(null);
      return;
    }
    const { lesson: u } = row;
    const canPanel = lessonUsesOutlineSubstepAccordion(u, module) && steps.length > 1;
    setOpenLessonId(u.id === currentLessonId && canPanel ? currentLessonId : null);
  }, [currentLessonId, module, lessons, steps.length]);

  const onToggle = useCallback((id: string) => {
    setOpenLessonId((prev) => (prev === id ? null : id));
  }, []);

  const onNavigate = useCallback(() => {
    /* reserved for future focus / analytics */
  }, []);

  return (
    <div className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-2.5 ring-1 ring-stone-200/50">
      <p className="px-1 pb-2 text-[0.7rem] font-medium text-slate-500">
        שיעורים ביחידה
        <span className="ms-1.5 tabular-nums text-slate-400">
          ({completedInUnit}/{totalInUnit} הושלמו)
        </span>
      </p>
      <ul className="space-y-1.5">
        {lessons.map((row) => {
          const { lesson, moduleOrdinal: lessonOrd, indexInModule, visualKind, status } = row;
          const num = `${lessonOrd}.${indexInModule + 1}`;
          const isCurrent = lesson.id === currentLessonId;
          const stepCount = isCurrent ? steps.length : 0;
          const showSubstepPanel = isCurrent && stepCount > 1 && lessonUsesOutlineSubstepAccordion(lesson, module);
          const outlineChrome = outlineChromeForLesson(lesson, module, isCurrent, isCurrent ? stepCount : 99);
          const isOpen = openLessonId === lesson.id;
          return (
            <li key={lesson.id} className="min-w-0">
              <CourseOutlineLessonAccordion
                href={lessonHref(lesson.id)}
                lessonId={lesson.id}
                lessonNumberLabel={num}
                title={lesson.title}
                visualKind={visualKind}
                estimatedMinutes={lesson.estimatedMinutes ?? null}
                status={status}
                isCurrent={isCurrent}
                isOpen={isOpen}
                onToggle={onToggle}
                onNavigate={onNavigate}
                showSubstepPanel={showSubstepPanel}
                outlineChrome={outlineChrome}
                steps={steps}
                activeStepIndex={activeStepIndex}
                completedStepIndices={completedStepIndices}
                onSelectStep={onSelectStep}
                prefersReducedMotion={prefersReducedMotion}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
