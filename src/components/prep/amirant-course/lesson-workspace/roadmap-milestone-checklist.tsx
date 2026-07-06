"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoadmapMilestoneGroup } from "@/lib/amirant-course/lesson-content/roadmap-premium-parse";
import { lessonSaaS } from "../lesson/ui/lesson-saas-tokens";
import { cn } from "@/lib/design-system/cn";

const STORAGE_KEY = "amirant-roadmap-milestone-checks-v1";
const TRACK_STORAGE_KEY = "amirant-roadmap-selected-track-v1";

function readStored(): Record<string, boolean[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, boolean[]>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

type Props = { groups: RoadmapMilestoneGroup[] };

/**
 * בוחר נושא/מסלול (צ'יפים) + צ'ק-ליסט של הנושא הנבחר בלבד — במקום עמוד ארוך
 * של כל הרשימות. הבחירה והסימונים נשמרים ב-localStorage.
 */
export function RoadmapMilestoneChecklist({ groups }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  useEffect(() => {
    setChecks(readStored());
    try {
      const stored = localStorage.getItem(TRACK_STORAGE_KEY);
      if (stored) setSelectedTrack(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const selectTrack = useCallback((title: string) => {
    setSelectedTrack(title);
    try {
      localStorage.setItem(TRACK_STORAGE_KEY, title);
    } catch {
      /* ignore quota */
    }
  }, []);

  const setItem = useCallback((groupKey: string, i: number, n: number, v: boolean) => {
    setChecks((prev) => {
      const row = [...(prev[groupKey] ?? Array(n).fill(false))];
      if (row.length < n) row.length = n;
      row[i] = v;
      const next = { ...prev, [groupKey]: row };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  if (!groups.length) return null;

  const activeTitle = groups.some((g) => g.title === selectedTrack) ? selectedTrack : groups[0]?.title ?? null;
  const activeGroup = groups.find((g) => g.title === activeTitle) ?? null;
  const activeRow = activeGroup ? checks[activeGroup.title] ?? activeGroup.items.map(() => false) : [];

  return (
    <div className="space-y-4 [direction:rtl]">
      <p className={cn(lessonSaaS.eyebrowGuided, "text-pretty")}>בחרו נושא — ותקבלו את רשימת המשימות שלו</p>

      {/* בוחר נושא */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="בחירת נושא">
        {groups.map((g) => {
          const row = checks[g.title] ?? [];
          const done = row.filter(Boolean).length;
          const isActive = g.title === activeTitle;
          return (
            <button
              key={g.title}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTrack(g.title)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-[#0f2347] text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-stone-200 hover:ring-sky-700/40",
              )}
            >
              {g.title}
              <span className={cn("ms-2 text-xs tabular-nums", isActive ? "text-white/70" : "text-slate-400")}>
                {done}/{g.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* הצ'ק-ליסט של הנושא הנבחר */}
      {activeGroup ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-5 [direction:rtl] [text-align:start] sm:p-6">
          <p className="text-base font-semibold text-[#0f2347] sm:text-lg">{activeGroup.title}</p>
          <ul className="mt-3 space-y-2.5" role="list">
            {activeGroup.items.map((label, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  className="mt-1.5 h-4 w-4 shrink-0 rounded border-stone-300 text-sky-800 focus:ring-sky-700/40"
                  checked={Boolean(activeRow[i])}
                  onChange={(e) => setItem(activeGroup.title, i, activeGroup.items.length, e.target.checked)}
                />
                <span className="text-base leading-7 text-slate-800 [text-wrap:pretty] sm:text-lg sm:leading-8">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
