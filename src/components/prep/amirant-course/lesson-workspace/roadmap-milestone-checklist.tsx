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
 * "סוף שבוע 3: ניסוח מחדש - מוכן" → { num: "3", name: "ניסוח מחדש" } לתצוגה
 * אחידה בבוחר; הכותרת המלאה נשארת מפתח האחסון (לא שוברים סימונים קיימים).
 */
function parseGroupTitle(title: string, index: number): { num: string; name: string } {
  const m = title.match(/^סוף שבוע\s*(\d+)\s*:\s*(.+)$/);
  const rawName = (m?.[2] ?? title).trim();
  const name = rawName.replace(/\s*[-–]\s*מוכן\s*$/, "").trim();
  return { num: m?.[1] ?? String(index + 1), name };
}

/**
 * בוחר נושא (רשימה אנכית אחידה) + צ'ק-ליסט של הנושא הנבחר בלבד — במקום עמוד
 * ארוך של כל הרשימות. הבחירה והסימונים נשמרים ב-localStorage.
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

  const activeParsed = activeGroup
    ? parseGroupTitle(activeGroup.title, groups.findIndex((g) => g.title === activeGroup.title))
    : null;
  const activeDone = activeRow.filter(Boolean).length;

  return (
    <div className="space-y-4 [direction:rtl]">
      <p className={cn(lessonSaaS.eyebrowGuided, "text-pretty")}>בחרו נושא — ותקבלו את רשימת המשימות שלו</p>

      {/* בוחר נושא — רשימה אנכית אחידה: מספר · שם · התקדמות */}
      <div
        className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white"
        role="tablist"
        aria-label="בחירת נושא"
      >
        {groups.map((g, idx) => {
          const row = checks[g.title] ?? [];
          const done = row.filter(Boolean).length;
          const isActive = g.title === activeTitle;
          const { num, name } = parseGroupTitle(g.title, idx);
          const complete = done === g.items.length && g.items.length > 0;
          return (
            <button
              key={g.title}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTrack(g.title)}
              className={cn(
                "grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 text-start transition",
                idx > 0 && "border-t border-stone-100",
                isActive ? "bg-[#0f2347] text-white" : "bg-white text-slate-800 hover:bg-sky-50/60",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                  isActive ? "bg-white/15 text-white" : "bg-[#0f2347]/[0.06] text-[#0f2347]",
                )}
              >
                {num}
              </span>
              <span className="truncate text-sm font-semibold sm:text-base">{name}</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                  complete
                    ? "bg-emerald-100 text-emerald-800"
                    : isActive
                      ? "bg-white/15 text-white/85"
                      : "bg-stone-100 text-slate-500",
                )}
              >
                {complete ? "✓ הושלם" : `${done}/${g.items.length}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* הצ'ק-ליסט של הנושא הנבחר */}
      {activeGroup && activeParsed ? (
        <div className="rounded-2xl border border-stone-200/80 bg-white [direction:rtl] [text-align:start]">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-medium text-slate-500">שבוע {activeParsed.num}</p>
              <p className="mt-0.5 text-base font-semibold text-[#0f2347] sm:text-lg">{activeParsed.name}</p>
            </div>
            <span className="text-xs tabular-nums text-slate-500">
              {activeDone}/{activeGroup.items.length} הושלמו
            </span>
          </div>
          <ul className="px-5 py-2 sm:px-6" role="list">
            {activeGroup.items.map((label, i) => (
              <li key={i} className={cn(i > 0 && "border-t border-stone-100")}>
                <label className="flex cursor-pointer items-start gap-3 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 shrink-0 rounded border-stone-300 text-sky-800 focus:ring-sky-700/40"
                    checked={Boolean(activeRow[i])}
                    onChange={(e) => setItem(activeGroup.title, i, activeGroup.items.length, e.target.checked)}
                  />
                  <span
                    className={cn(
                      "text-base leading-7 [text-wrap:pretty]",
                      activeRow[i] ? "text-slate-400 line-through decoration-slate-300" : "text-slate-800",
                    )}
                  >
                    {label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
