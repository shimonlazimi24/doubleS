"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useId, useTransition } from "react";
import { cn } from "@/lib/design-system/cn";
import type { LessonProgressStatus } from "@/lib/amirant-course/progress-calculations";
import type { OutlineLessonVisualKind } from "@/lib/amirant-course/course-outline-visual-kind";
import { OutlineLessonKindIcon } from "./OutlineLessonKindIcon";
import { CourseOutlineStepRow } from "./CourseOutlineStepRow";
import type { BuiltWorkspaceStep } from "../lesson-workspace/workspace-step";

const CHROME_EASE = "duration-200 ease-out motion-reduce:duration-0";
const CHEVRON_CLASS = cn("h-4 w-4 text-slate-500 transition-transform", CHROME_EASE);

function RowChevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(CHEVRON_CLASS, open && "rotate-180", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RowPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 text-sky-900/90", className)} fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7-11-7z" />
    </svg>
  );
}

export type LessonOutlineChrome = "chevron" | "play" | "none";

type Props = {
  href: string;
  lessonId: string;
  lessonNumberLabel: string;
  title: string;
  visualKind: OutlineLessonVisualKind;
  estimatedMinutes: number | null;
  status: LessonProgressStatus;
  isCurrent: boolean;
  isOpen: boolean;
  onToggle: (lessonId: string) => void;
  onNavigate?: (href: string) => void;
  /** Show expandable step list (current lesson + 2+ steps + not quiz-style). */
  showSubstepPanel: boolean;
  outlineChrome: LessonOutlineChrome;
  steps: BuiltWorkspaceStep[];
  activeStepIndex: number;
  completedStepIndices: Set<number>;
  onSelectStep: (index: number) => void;
  prefersReducedMotion: boolean;
};

/**
 * chevron: אקורדיון שלבים. play: כניסה/מבחן ללא שלבי משנה. none: שיעור בודד ללא בקרה מובילה.
 */
export function CourseOutlineLessonAccordion({
  href,
  lessonId,
  lessonNumberLabel,
  title,
  visualKind,
  estimatedMinutes,
  status,
  isCurrent,
  isOpen,
  onToggle,
  onNavigate,
  showSubstepPanel,
  outlineChrome,
  steps,
  activeStepIndex,
  completedStepIndices,
  onSelectStep,
  prefersReducedMotion,
}: Props) {
  const router = useRouter();
  const [isNavPending, startNavTransition] = useTransition();
  const baseId = useId();
  const panelId = `lesson-panel-${baseId.replace(/[:]/g, "")}`;
  const expanded = showSubstepPanel && isOpen;
  const done = status === "completed";

  const goToLesson = useCallback(() => {
    onNavigate?.(href);
    startNavTransition(() => {
      router.push(href);
    });
  }, [href, onNavigate, router, startNavTransition]);

  const onPrimaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outlineChrome === "chevron") {
      if (isCurrent && showSubstepPanel) onToggle(lessonId);
      if (!isCurrent) goToLesson();
      return;
    }
    if (outlineChrome === "play") {
      if (!isCurrent) goToLesson();
    }
  };

  const onPrimaryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      (onPrimaryClick as (ev: React.MouseEvent) => void)(e as unknown as React.MouseEvent);
    }
  };

  const rowShell = isCurrent
    ? cn(
        isOpen && showSubstepPanel
          ? "border-sky-800/40 bg-sky-50/95 ring-1 ring-sky-800/10"
          : "border-sky-800/25 bg-sky-50/80 ring-1 ring-sky-800/5",
        isNavPending && "opacity-85",
        "border duration-200 ease-out motion-reduce:duration-0",
      )
    : cn("border border-transparent", isNavPending && "opacity-80", "duration-200 ease-out motion-reduce:duration-0");

  const typeIcon = (
    <span
      className={cn(
        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
        isCurrent
          ? "border-sky-800/30 bg-white shadow-sm text-sky-900"
          : "border-stone-200/90 bg-stone-100/80 text-sky-900",
      )}
    >
      {done ? (
        <span className="text-emerald-600" aria-hidden>
          ✓
        </span>
      ) : (
        <OutlineLessonKindIcon kind={visualKind} className="text-sky-900" />
      )}
    </span>
  );

  const leadButton = (() => {
    if (outlineChrome === "none") return null;
    if (outlineChrome === "play") {
      return (
        <button
          type="button"
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition",
            isCurrent
              ? "border-slate-200/80 bg-slate-100/90 text-slate-500"
              : "border-sky-800/25 bg-white text-sky-900 shadow-sm hover:border-sky-800/40 hover:bg-sky-50/90",
            isCurrent && "pointer-events-none cursor-default",
            CHROME_EASE,
          )}
          disabled={isCurrent}
          onClick={onPrimaryClick}
          onKeyDown={onPrimaryKeyDown}
          title={isCurrent ? "בשיעור המבחן" : "מעבר לשיעור"}
          aria-label={isCurrent ? "השיעור הנוכחי" : "מעבר לשיעור (התחלת מבחן)"}
          aria-current={isCurrent ? "true" : undefined}
        >
          <RowPlay className={isCurrent ? "opacity-40" : undefined} />
        </button>
      );
    }
    return (
      <button
        type="button"
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition",
          isCurrent
            ? "border-sky-800/30 bg-white shadow-sm"
            : "border-stone-200/80 bg-stone-100/90 hover:border-stone-300",
          CHROME_EASE,
        )}
        aria-expanded={isCurrent && showSubstepPanel ? isOpen : undefined}
        aria-controls={showSubstepPanel ? panelId : undefined}
        onClick={onPrimaryClick}
        onKeyDown={onPrimaryKeyDown}
        title={isCurrent && showSubstepPanel ? (isOpen ? "סגירת שלבים" : "הצגת שלבים") : "מעבר לשיעור"}
        aria-label={isCurrent && showSubstepPanel ? (isOpen ? "סגור שלבי שיעור" : "הצג שלבי שיעור") : "מעבר לשיעור"}
      >
        <RowChevron open={Boolean(isCurrent && showSubstepPanel && isOpen)} className={!isCurrent ? "text-slate-400" : undefined} />
      </button>
    );
  })();

  return (
    <div className="min-w-0" data-lesson-accordion={lessonId}>
      <div className={cn("rounded-lg px-1.5 py-1.5", rowShell)}>
        <div className="flex min-w-0 items-start gap-1.5">
          {leadButton}

          {typeIcon}

          {isCurrent ? (
            <div className="min-w-0 flex-1 pt-0.5" aria-current="page">
              <p className="text-[0.8125rem] font-semibold leading-snug text-[#0f2347] [text-wrap:balance] sm:text-[0.84375rem]">
                <span className="tabular-nums text-slate-500">{lessonNumberLabel}</span> {title}
              </p>
              {estimatedMinutes != null && estimatedMinutes > 0 ? (
                <span className="mt-0.5 block text-[0.7rem] text-slate-500">{estimatedMinutes} דק׳</span>
              ) : null}
            </div>
          ) : (
            <Link
              href={href}
              className="min-w-0 flex-1 touch-manipulation pt-0.5 text-start"
              scroll
              onClick={() => onNavigate?.(href)}
            >
              <span className="block font-medium text-[#0f2347] [text-wrap:balance] sm:text-[0.84375rem]">
                <span className="tabular-nums text-slate-500">{lessonNumberLabel}</span> {title}
              </span>
              {estimatedMinutes != null && estimatedMinutes > 0 ? (
                <span className="mt-0.5 block text-[0.7rem] text-slate-500">{estimatedMinutes} דק׳</span>
              ) : null}
            </Link>
          )}
        </div>
      </div>

      {showSubstepPanel ? (
        <div
          className={cn(
            "grid min-h-0 [transition:grid-template-rows_220ms_cubic-bezier(0.4,0,0.2,1),opacity_200ms_ease-out] motion-reduce:[transition:grid-template-rows_0.01ms_linear,opacity_0.01ms_linear]",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div id={panelId} className="min-h-0 overflow-hidden">
            <div
              className="mt-1.5 border-s border-sky-800/20 pb-1.5 pe-0 ps-3.5 ms-1 [transition:opacity_200ms_ease-out] motion-reduce:transition-none"
              data-expanded={expanded ? "true" : "false"}
              style={expanded ? undefined : { pointerEvents: "none" as const }}
            >
              <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-slate-500">שלבים בשיעור</p>
              <nav className="space-y-0.5" aria-label="שלבי השיעור הנוכחי">
                {steps.map((s, i) => (
                  <CourseOutlineStepRow
                    key={s.id}
                    index={i}
                    label={s.label}
                    active={i === activeStepIndex}
                    completed={completedStepIndices.has(i) && i !== activeStepIndex}
                    onSelect={() => onSelectStep(i)}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
