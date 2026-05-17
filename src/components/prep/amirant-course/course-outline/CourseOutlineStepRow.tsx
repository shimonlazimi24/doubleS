"use client";

import { cn } from "@/lib/design-system/cn";

type Props = {
  index: number;
  label: string;
  active: boolean;
  completed: boolean;
  onSelect: () => void;
  /** When true, skip long transitions (align with `prefers-reduced-motion`). */
  prefersReducedMotion?: boolean;
};

const STEP_EASE = "duration-200 ease-out motion-reduce:duration-0";

/** Nested step under the current lesson — compact, light surface. */
export function CourseOutlineStepRow({ index, label, active, completed, onSelect, prefersReducedMotion }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-2 rounded-md py-1.5 pe-2 ps-5 text-start text-[0.8125rem] leading-snug",
        "transition-[background-color,box-shadow,color,transform] " + STEP_EASE,
        active
          ? "bg-[#0f2347] font-semibold text-white shadow-sm ring-1 ring-sky-800/20"
          : completed
            ? "text-slate-700 hover:bg-stone-100/90"
            : "text-slate-600 hover:bg-stone-50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums transition-colors " + STEP_EASE,
          active ? "bg-white/15 text-white" : completed ? "text-emerald-600" : "text-slate-500",
        )}
        aria-hidden
      >
        {completed && !active ? "✓" : index + 1}
      </span>
      <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere]">{label}</span>
    </button>
  );
}
