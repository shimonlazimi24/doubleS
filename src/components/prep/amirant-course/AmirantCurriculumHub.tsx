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
    <div dir="rtl" className="mx-auto max-w-2xl px-4 py-10">

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

      {/* ── Module list ── */}
      <div className="space-y-1">
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
              className={`group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors ${
                isCurrent
                  ? "bg-[#fffbee] ring-1 ring-[#d4a843]/40"
                  : "hover:bg-[#f8faff]"
              }`}
            >
              {/* Icon */}
              <span className="text-xl w-7 shrink-0 text-center">
                {allDone ? "✅" : MODULE_ICON[mod.id] ?? "📌"}
              </span>

              {/* Title + bar */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${allDone ? "text-[#64748b]" : "text-[#0f1e3d]"}`}>
                  {mod.title}
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#edf0f7]">
                  <div
                    className={`h-1 rounded-full transition-all ${allDone ? "bg-emerald-400" : "bg-[#0f1e3d]"}`}
                    style={{ width: `${modPct}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <span className="shrink-0 text-xs text-[#94a3b8] group-hover:text-[#0f1e3d] transition-colors">
                {allDone ? "✓" : isCurrent ? "ממשיך ←" : done > 0 ? `${done}/${total}` : `${total} שיעורים`}
              </span>
            </Link>
          );
        })}

        {/* Simulations */}
        {manifest.simulations.length > 0 && (
          <Link
            href={`${BASE}/simulation/${manifest.simulations[0]!.id}`}
            className="group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-[#f8faff]"
          >
            <span className="text-xl w-7 shrink-0 text-center">🏆</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0f1e3d]">סימולציות מלאות</p>
              <p className="mt-0.5 text-xs text-[#94a3b8]">מבחן בתנאי אמת</p>
            </div>
            <span className="shrink-0 text-xs text-[#94a3b8] group-hover:text-[#0f1e3d] transition-colors">
              {manifest.simulations.length} מבחנים
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
