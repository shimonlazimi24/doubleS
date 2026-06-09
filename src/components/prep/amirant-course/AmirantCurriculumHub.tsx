"use client";

import { useState } from "react";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import type { ManifestModule, ManifestLesson } from "@/lib/amirant-course/types/course-manifest";

const BASE = `${PREP_BASE}/amirant/course`;

function lessonHref(lesson: ManifestLesson) {
  return `${BASE}/lesson/${lesson.id}`;
}

function LessonRow({
  lesson,
  isComplete,
  isCurrent,
  moduleIndex,
  lessonIndex,
}: {
  lesson: ManifestLesson;
  isComplete: boolean;
  isCurrent: boolean;
  moduleIndex: number;
  lessonIndex: number;
}) {
  const href = lessonHref(lesson);
  const mins = lesson.estimatedMinutes ?? 20;

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${
        isCurrent
          ? "border border-[#d4a843]/50 bg-[#fffbee] shadow-sm"
          : isComplete
            ? "hover:bg-[#f4f7ff]"
            : "hover:bg-[#f8faff]"
      }`}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {isComplete ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5L5.5 10L11 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : isCurrent ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#d4a843] bg-[#d4a843]/10">
            <div className="h-2 w-2 rounded-full bg-[#d4a843]" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#d6deec] bg-white text-[10px] font-bold text-[#94a3b8]">
            {moduleIndex + 1}.{lessonIndex + 1}
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isCurrent ? "text-[#0f1e3d]" : isComplete ? "text-[#5a6480]" : "text-[#0f1e3d]"}`}>
          {lesson.title}
        </p>
        <p className="mt-0.5 text-xs text-[#94a3b8]">
          {lesson.kind === "video" ? "📹" : "📖"} {mins} דקות
          {lesson.quizId ? " · כולל בוחן" : ""}
        </p>
      </div>

      {/* Arrow / CTA */}
      <div className={`shrink-0 text-sm font-semibold transition-transform group-hover:translate-x-[-2px] ${isCurrent ? "text-[#d4a843]" : "text-[#c8d4e8] group-hover:text-[#0f1e3d]"}`}>
        {isCurrent ? "המשך ←" : isComplete ? "חזור" : "←"}
      </div>
    </Link>
  );
}

function ModuleSection({
  mod,
  moduleIndex,
  completedIds,
  currentLessonId,
  defaultOpen,
}: {
  mod: ManifestModule;
  moduleIndex: number;
  completedIds: Set<string>;
  currentLessonId: string | null;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const completedInModule = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  const total = mod.lessons.length;
  const allDone = completedInModule === total && total > 0;
  const hasCurrentLesson = mod.lessons.some((l) => l.id === currentLessonId);

  return (
    <div className={`rounded-2xl border ${allDone ? "border-emerald-200 bg-emerald-50/30" : hasCurrentLesson ? "border-[#d4a843]/40 bg-[#fffdf5]" : "border-[#d6deec] bg-white"}`}>
      {/* Module header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-right"
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${allDone ? "bg-emerald-500 text-white" : "bg-[#0f1e3d] text-white"}`}>
          {allDone ? "✓" : moduleIndex + 1}
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate font-semibold text-[#0f1e3d]">{mod.title}</p>
          <p className="mt-0.5 text-xs text-[#5a6480]">
            {completedInModule}/{total} שיעורים
            {mod.quizzes.length > 0 ? ` · ${mod.quizzes.length} בוחן` : ""}
          </p>
        </div>
        {/* Mini progress */}
        <div className="hidden w-24 shrink-0 sm:block">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f7]">
            <div
              className={`h-1.5 rounded-full transition-all ${allDone ? "bg-emerald-500" : "bg-[#0f1e3d]"}`}
              style={{ width: `${total > 0 ? Math.round((completedInModule / total) * 100) : 0}%` }}
            />
          </div>
        </div>
        <span className={`shrink-0 text-lg text-[#94a3b8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>

      {/* Lesson list */}
      {open && (
        <div className="border-t border-[#edf0f7] px-3 pb-3 pt-2 space-y-1">
          {mod.lessons.map((lesson, li) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              isComplete={completedIds.has(lesson.id)}
              isCurrent={lesson.id === currentLessonId}
              moduleIndex={moduleIndex}
              lessonIndex={li}
            />
          ))}
          {mod.quizzes.length > 0 && (
            <div className="mt-2 border-t border-[#edf0f7] pt-2">
              {mod.quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`${BASE}/quiz/${quiz.id}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0f1e3d] hover:bg-[#f8faff]"
                >
                  <span className="text-base">📝</span>
                  <span className="flex-1">{quiz.title}</span>
                  <span className="text-xs text-[#94a3b8]">{quiz.questionCount} שאלות</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AmirantCurriculumHub() {
  const progress = useAmirantCourseProgress();
  const manifest = AMIRANT_PREPARATION_MANIFEST;

  const completedIds = new Set(
    manifest.modules
      .flatMap((m) => m.lessons)
      .filter((l) => progress.getLessonStatus(l.id) === "completed")
      .map((l) => l.id),
  );

  // Find current lesson (first incomplete)
  let currentLessonId: string | null = null;
  for (const mod of manifest.modules) {
    for (const lesson of mod.lessons) {
      if (!completedIds.has(lesson.id)) {
        currentLessonId = lesson.id;
        break;
      }
    }
    if (currentLessonId) break;
  }

  const totalLessons = manifest.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedCount = completedIds.size;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const currentLesson = currentLessonId
    ? manifest.modules.flatMap((m) => m.lessons).find((l) => l.id === currentLessonId)
    : null;

  // Find which module has the current lesson (to open by default)
  const currentModuleIndex = currentLessonId
    ? manifest.modules.findIndex((m) => m.lessons.some((l) => l.id === currentLessonId))
    : 0;

  return (
    <div dir="rtl" className="pb-20">
      {/* ── Hero / Progress bar ── */}
      <div className="border-b border-[#1b3366]/20 bg-gradient-to-br from-[#0f1e3d] via-[#1a3260] to-[#0d1a35] px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f1d286]">
            הכנה לאמירנט
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">
            {completedCount === 0 ? "ברוכים הבאים לקורס" : `המשך — שיעור ${completedCount + 1} מתוך ${totalLessons}`}
          </h1>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-white/60">
              <span>{completedCount} שיעורים הושלמו</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-[#d4a843] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          {currentLesson && (
            <Link
              href={lessonHref(currentLesson)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d4a843] px-6 py-3 text-sm font-bold text-[#0f1e3d] transition hover:bg-[#e7bb59]"
            >
              {completedCount === 0 ? "התחל את השיעור הראשון" : `המשך: ${currentLesson.title}`} ←
            </Link>
          )}
          {!currentLesson && completedCount > 0 && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white">
              🎉 סיימת את כל השיעורים!
            </div>
          )}
        </div>
      </div>

      {/* ── Curriculum ── */}
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">
          תוכנית הקורס — {manifest.modules.length} מודולים · {totalLessons} שיעורים
        </p>

        {manifest.modules.map((mod, mi) => (
          <ModuleSection
            key={mod.id}
            mod={mod}
            moduleIndex={mi}
            completedIds={completedIds}
            currentLessonId={currentLessonId}
            defaultOpen={mi === currentModuleIndex}
          />
        ))}

        {/* Simulations */}
        {manifest.simulations.length > 0 && (
          <div className="rounded-2xl border border-[#d6deec] bg-white">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a3260] text-white">
                ▣
              </div>
              <div className="flex-1 text-right">
                <p className="font-semibold text-[#0f1e3d]">סימולציות מלאות</p>
                <p className="mt-0.5 text-xs text-[#5a6480]">{manifest.simulations.length} סימולציות בתנאי מבחן</p>
              </div>
            </div>
            <div className="border-t border-[#edf0f7] px-3 pb-3 pt-2 space-y-1">
              {manifest.simulations.map((sim) => (
                <Link
                  key={sim.id}
                  href={`${BASE}/simulation/${sim.id}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#0f1e3d] hover:bg-[#f8faff]"
                >
                  <span className="text-base">🎯</span>
                  <span className="flex-1">{sim.title}</span>
                  <span className="text-xs text-[#94a3b8]">←</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
