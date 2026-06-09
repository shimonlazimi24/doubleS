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

const MODULE_META: Record<string, { icon: string; color: string; badge?: string }> = {
  "mod-intro":     { icon: "🗺️", color: "#1a3260" },
  "mod-vocab":     { icon: "📚", color: "#1a3260", badge: "קושי עולה" },
  "mod-sc":        { icon: "✏️", color: "#1a3260", badge: "AI אדפטיבי" },
  "mod-rephrase":  { icon: "🔄", color: "#1a3260", badge: "AI אדפטיבי" },
  "mod-reading":   { icon: "📖", color: "#1a3260", badge: "AI אדפטיבי" },
  "mod-reform":    { icon: "🎧", color: "#7c3aed", badge: "2026" },
  "mod-sims":      { icon: "🎯", color: "#0f766e", badge: "סימולציות" },
  "mod-tips":      { icon: "💡", color: "#b45309" },
  "mod-summary":   { icon: "🏁", color: "#1a3260", badge: "סיכום" },
  "mod-logistics": { icon: "📋", color: "#64748b" },
};

/** Drawer — list of lessons inside a module */
function LessonDrawer({
  mod,
  completedIds,
  currentLessonId,
  onClose,
}: {
  mod: ManifestModule;
  completedIds: Set<string>;
  currentLessonId: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" style={{ maxHeight: "80dvh" }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#d6deec]" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#edf0f7] px-5 py-4">
          <span className="text-2xl">{MODULE_META[mod.id]?.icon ?? "📌"}</span>
          <div className="flex-1">
            <p className="font-bold text-[#0f1e3d]">{mod.title}</p>
            <p className="text-xs text-[#94a3b8]">{mod.lessons.length} שיעורים</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f1e3d]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Lesson list */}
        <div className="overflow-y-auto px-3 pb-6 pt-2" style={{ maxHeight: "calc(80dvh - 80px)" }}>
          {mod.lessons.map((lesson, li) => {
            const isComplete = completedIds.has(lesson.id);
            const isCurrent = lesson.id === currentLessonId;
            return (
              <Link
                key={lesson.id}
                href={lessonHref(lesson)}
                className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 transition-all ${
                  isCurrent ? "border border-[#d4a843]/40 bg-[#fffbee]" : "hover:bg-[#f8faff]"
                }`}
              >
                <div className="shrink-0">
                  {isComplete ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#d4a843] bg-[#d4a843]/10">
                      <div className="h-2 w-2 rounded-full bg-[#d4a843]" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#d6deec] bg-white text-[10px] font-bold text-[#94a3b8]">
                      {li + 1}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${isComplete ? "text-[#5a6480]" : "text-[#0f1e3d]"}`}>
                    {lesson.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">
                    {lesson.kind === "video" ? "🎬" : "📖"} {lesson.estimatedMinutes ?? 20} דק׳
                    {lesson.quizId ? " · בוחן" : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${isCurrent ? "text-[#d4a843]" : "text-[#c8d4e8] group-hover:text-[#0f1e3d]"}`}>
                  {isCurrent ? "המשך ←" : "←"}
                </span>
              </Link>
            );
          })}

          {/* Quizzes */}
          {mod.quizzes.length > 0 && (
            <div className="mt-2 border-t border-[#edf0f7] pt-2">
              {mod.quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`${BASE}/quiz/${quiz.id}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-[#f8faff]"
                >
                  <span className="text-base">📝</span>
                  <span className="flex-1 text-sm font-medium text-[#0f1e3d]">{quiz.title}</span>
                  <span className="text-xs text-[#94a3b8]">{quiz.questionCount} שאלות</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Single module card in the grid */
function ModuleCard({
  mod,
  moduleIndex,
  completedIds,
  currentLessonId,
}: {
  mod: ManifestModule;
  moduleIndex: number;
  completedIds: Set<string>;
  currentLessonId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const completedInModule = mod.lessons.filter((l) => completedIds.has(l.id)).length;
  const total = mod.lessons.length;
  const pct = total > 0 ? Math.round((completedInModule / total) * 100) : 0;
  const allDone = completedInModule === total && total > 0;
  const hasCurrentLesson = mod.lessons.some((l) => l.id === currentLessonId);
  const hasAdaptiveQuiz = mod.quizzes.some((q) => q.adaptive);
  const meta = MODULE_META[mod.id] ?? { icon: "📌", color: "#1a3260" };

  // Find first incomplete lesson for quick-start CTA
  const nextLesson = mod.lessons.find((l) => !completedIds.has(l.id));

  const borderClass = allDone
    ? "border-emerald-200"
    : hasCurrentLesson
    ? "border-[#d4a843]/50 ring-1 ring-[#d4a843]/20"
    : "border-[#e2e8f0]";

  return (
    <>
      <div
        className={`group relative flex cursor-pointer flex-col rounded-2xl border bg-white transition-all hover:shadow-md ${borderClass}`}
        onClick={() => setOpen(true)}
      >
        {/* Current indicator */}
        {hasCurrentLesson && !allDone && (
          <div className="absolute -top-2 right-4 rounded-full bg-[#d4a843] px-2.5 py-0.5 text-[10px] font-bold text-[#0f1e3d]">
            ▶ ממשיך כאן
          </div>
        )}

        <div className="p-5">
          {/* Icon row */}
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ background: `${meta.color}15` }}
            >
              {allDone ? "✅" : meta.icon}
            </div>
            <div className="flex flex-col items-end gap-1">
              {hasAdaptiveQuiz && (
                <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[9px] font-bold text-[#1a56db]">🤖 AI</span>
              )}
              {meta.badge && (
                <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[9px] text-[#5a6480]">{meta.badge}</span>
              )}
            </div>
          </div>

          {/* Title */}
          <p className="mt-3 font-bold text-[#0f1e3d] leading-snug">{mod.title}</p>

          {/* Stats */}
          <p className="mt-1 text-xs text-[#94a3b8]">
            {total} שיעורים
            {mod.quizzes.length > 0 ? ` · ${mod.quizzes.length} בוחן` : ""}
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className={allDone ? "font-semibold text-emerald-600" : "text-[#94a3b8]"}>
                {allDone ? "✓ הושלם" : `${completedInModule}/${total}`}
              </span>
              <span className="font-semibold text-[#5a6480]">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f7]">
              <div
                className={`h-1.5 rounded-full transition-all ${allDone ? "bg-emerald-500" : "bg-[#0f1e3d]"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className={`mt-auto border-t px-5 py-3 ${allDone ? "border-emerald-100 bg-emerald-50/40" : "border-[#f1f5f9] bg-[#f8faff]"}`}>
          {allDone ? (
            <p className="text-xs font-semibold text-emerald-600">לחץ לחזרה ←</p>
          ) : nextLesson ? (
            <p className="text-xs font-semibold text-[#0f1e3d] group-hover:text-[#1a56db]">
              {completedInModule === 0 ? "התחל מודול ←" : "המשך ←"}
            </p>
          ) : (
            <p className="text-xs text-[#94a3b8]">צפה בשיעורים ←</p>
          )}
        </div>
      </div>

      {open && (
        <LessonDrawer
          mod={mod}
          completedIds={completedIds}
          currentLessonId={currentLessonId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
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

  return (
    <div dir="rtl" className="pb-20">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#0f1e3d] via-[#1a3260] to-[#0d1a35] px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f1d286]">הכנה לאמירנט</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">
            {completedCount === 0 ? "ברוכים הבאים לקורס" : `המשך — שיעור ${completedCount + 1} מתוך ${totalLessons}`}
          </h1>

          <div className="mt-5 max-w-sm">
            <div className="mb-2 flex justify-between text-xs text-white/60">
              <span>{completedCount} שיעורים הושלמו</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-2 rounded-full bg-[#d4a843] transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

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

      {/* ── X-Factor strip ── */}
      <div className="border-b border-[#edf0f7] bg-[#f8faff] px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 sm:justify-start">
          {[
            { icon: "🤖", label: "AI אדפטיבי", sub: "מסתגל לרמתך" },
            { icon: "📈", label: "קושי עולה", sub: "6 רמות" },
            { icon: "🎯", label: "נקודות חולשה", sub: "חידוד אוטומטי" },
            { icon: "💬", label: "עוזר AI חי", sub: "רמז בכל שאלה" },
          ].map((x) => (
            <div key={x.label} className="flex items-center gap-2 rounded-xl border border-[#d6deec] bg-white px-3 py-2 shadow-sm">
              <span className="text-lg">{x.icon}</span>
              <div>
                <p className="text-[11px] font-bold text-[#0f1e3d]">{x.label}</p>
                <p className="text-[10px] text-[#94a3b8]">{x.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Module grid ── */}
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#b88a2f]">
          {manifest.modules.length} מודולים · {totalLessons} שיעורים — לחץ על מודול לפתיחה
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {manifest.modules.map((mod, mi) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              moduleIndex={mi}
              completedIds={completedIds}
              currentLessonId={currentLessonId}
            />
          ))}

          {/* Simulations card */}
          {manifest.simulations.length > 0 && (
            <Link
              href={`${BASE}/simulation/${manifest.simulations[0].id}`}
              className="group flex flex-col rounded-2xl border border-[#e2e8f0] bg-white transition-all hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: "#0f766e15" }}>
                  🏆
                </div>
                <p className="mt-3 font-bold text-[#0f1e3d]">סימולציות מלאות</p>
                <p className="mt-1 text-xs text-[#94a3b8]">{manifest.simulations.length} מבחנים · תנאי אמת</p>
                <div className="mt-4 h-1.5 rounded-full bg-[#edf0f7]" />
              </div>
              <div className="mt-auto border-t border-[#f1f5f9] bg-[#f8faff] px-5 py-3">
                <p className="text-xs font-semibold text-[#0f1e3d] group-hover:text-[#1a56db]">פתח סימולציה ←</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
