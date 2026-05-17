"use client";

import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";

type Props = {
  courseTitle: string;
  oneLiner: string;
};

/**
 * Program-first hero: total progress and enrollment framing (no marketing blocks).
 */
export function AmirantCourseProgramHeader({ courseTitle, oneLiner }: Props) {
  const { percentComplete, completedLessons, totalLessons } = useAmirantCourseProgress();
  return (
    <div className="overflow-hidden rounded-2xl border border-line/80 bg-gradient-to-l from-primary/[0.08] to-paper shadow-[0_1px_0_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.12)]">
      <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="min-w-0 space-y-2">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-primary/90">תכנית לימודים</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">{courseTitle}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">{oneLiner}</p>
        </div>
        <div
          className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-primary/25 bg-primary/5 px-6 py-5 text-center"
          role="img"
          aria-label={`התקדמות: ${percentComplete} אחוז, ${completedLessons} מתוך ${totalLessons} שיעורים`}
        >
          <div className="text-3xl font-bold tabular-nums text-primary md:text-4xl">{percentComplete}%</div>
          <p className="text-xs text-muted">התקדמות כללית</p>
          <p className="text-[0.7rem] tabular-nums text-muted/90">
            {completedLessons}/{totalLessons} שיעורים
          </p>
        </div>
      </div>
    </div>
  );
}
