"use client";

import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { useAmirantCourseProgress } from "./AmirantCourseProgressProvider";
import type { ManifestLesson } from "@/lib/amirant-course/types/course-manifest";

const BASE = `${PREP_BASE}/amirant/course`;

const MODULE_ICON: Record<string, string> = {
  "mod-intro":     "🗺️",
  "mod-vocab":     "📚",
  "mod-sc":        "✏️",
  "mod-rephrase":  "🔄",
  "mod-reading":   "📖",
  "mod-reform":    "🎧",
  "mod-sims":      "🎯",
  "mod-tips":      "💡",
  "mod-summary":   "🏁",
  "mod-logistics": "📋",
};

function lessonHref(lesson: ManifestLesson) {
  return `${BASE}/lesson/${lesson.id}`;
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

  // First incomplete lesson across all modules
  let nextLessonId: string | null = null;
  for (const mod of manifest.modules) {
    for (const lesson of mod.lessons) {
      if (!completedIds.has(lesson.id)) {
        nextLessonId = lesson.id;
        break;
      }
    }
    if (nextLessonId) break;
  }

  const allLessons = manifest.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = completedIds.size;
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const nextLesson = allLessons.find((l) => l.id === nextLessonId);

  return (
    <div dir="rtl" className="mx-auto max-w-3xl px-4 py-10 text-right">

      {/* ── Overall progress ── */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-xl font-bold text-[#0f1e3d]">הכנה לאמירנט</h1>
          <span className="text-sm text-[#94a3b8]">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0f7]">
          <div
            className="h-1.5 rounded-full bg-[#0f1e3d] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {nextLesson && (
          <Link
            href={lessonHref(nextLesson)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0f1e3d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3260]"
          >
            {completedCount === 0 ? "התחל" : "המשך"} ←
          </Link>
        )}
      </div>

      {/* ── Module cards grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {manifest.modules.map((mod) => {
          const done = mod.lessons.filter((l) => completedIds.has(l.id)).length;
          const total = mod.lessons.length;
          const modPct = total > 0 ? Math.round((done / total) * 100) : 0;
          const allDone = done === total && total > 0;
          const isCurrent = mod.lessons.some((l) => l.id === nextLessonId);

          const target =
            mod.lessons.find((l) => l.id === nextLessonId) ??
            mod.lessons.find((l) => !completedIds.has(l.id)) ??
            mod.lessons[0];
          const href = target ? lessonHref(target) : BASE;

          return (
            <Link
              key={mod.id}
              href={href}
              className={`group relative flex flex-col rounded-2xl border p-4 transition-all ${
                isCurrent
                  ? "border-[#d4a843]/50 bg-[#fffbee] shadow-sm"
                  : allDone
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-[#e8edf5] bg-white hover:border-[#0f1e3d]/20 hover:shadow-sm"
              }`}
            >
              {/* Icon */}
              <span className="mb-3 text-2xl">
                {allDone ? "✅" : MODULE_ICON[mod.id] ?? "📌"}
              </span>

              {/* Title */}
              <p className={`text-sm font-semibold leading-snug mb-auto ${allDone ? "text-[#64748b]" : "text-[#0f1e3d]"}`}>
                {mod.title}
              </p>

              {/* Lesson count */}
              <p className="mt-2 text-xs text-[#94a3b8]">
                {total} שיעורים
              </p>

              {/* Progress bar */}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#edf0f7]">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${allDone ? "bg-emerald-400" : isCurrent ? "bg-[#d4a843]" : "bg-[#0f1e3d]"}`}
                  style={{ width: `${modPct}%` }}
                />
              </div>

              {/* Status badge */}
              {isCurrent && (
                <span className="absolute top-3 left-3 text-[10px] font-semibold text-[#d4a843] bg-[#d4a843]/10 rounded-full px-2 py-0.5">
                  ממשיך
                </span>
              )}
            </Link>
          );
        })}

        {/* Simulations card */}
        {manifest.simulations.length > 0 && (
          <Link
            href={`${BASE}/simulation/${manifest.simulations[0]!.id}`}
            className="group flex flex-col rounded-2xl border border-[#e8edf5] bg-white p-4 transition-all hover:border-[#0f1e3d]/20 hover:shadow-sm"
          >
            <span className="mb-3 text-2xl">🏆</span>
            <p className="text-sm font-semibold text-[#0f1e3d] leading-snug mb-auto">סימולציות מלאות</p>
            <p className="mt-2 text-xs text-[#94a3b8]">{manifest.simulations.length} מבחנים בתנאי אמת</p>
            <div className="mt-2 h-1 rounded-full bg-[#edf0f7]" />
          </Link>
        )}
      </div>
    </div>
  );
}
