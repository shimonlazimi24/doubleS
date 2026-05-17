"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoadmapMilestoneGroup } from "@/lib/amirant-course/lesson-content/roadmap-premium-parse";
import { lessonSaaS } from "../lesson/ui/lesson-saas-tokens";
import { cn } from "@/lib/design-system/cn";

const STORAGE_KEY = "amirant-roadmap-milestone-checks-v1";

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
 * Per-item checkboxes; state persisted in localStorage. Same copy as the source list — presentation only.
 */
export function RoadmapMilestoneChecklist({ groups }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    setChecks(readStored());
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

  return (
    <div className="space-y-4 [direction:rtl]">
      <p className={cn(lessonSaaS.eyebrowGuided, "text-pretty")}>סמנו לפי ביצוע בפועל</p>
      <div className="grid gap-4 sm:grid-cols-1">
        {groups.map((g) => {
          const gk = g.title;
          const row = checks[gk] ?? g.items.map(() => false);
          return (
            <div
              key={gk}
              className="rounded-2xl border border-stone-200/80 bg-white p-5 [direction:rtl] [text-align:start] sm:p-6"
            >
              <p className="text-base font-semibold text-[#0f2347] sm:text-lg">{g.title}</p>
              <ul className="mt-3 space-y-2.5" role="list">
                {g.items.map((label, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-1.5 h-4 w-4 shrink-0 rounded border-stone-300 text-sky-800 focus:ring-sky-700/40"
                      checked={Boolean(row[i])}
                      onChange={(e) => setItem(gk, i, g.items.length, e.target.checked)}
                    />
                    <span className="text-base leading-7 text-slate-800 [text-wrap:pretty] sm:text-lg sm:leading-8">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
