"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/design-system/cn";

/**
 * Finding one lesson among 78.
 *
 * The list used to render every module expanded: 78 rows, ~12,000px of scroll,
 * no search and no filter. Editing `lesson.vocab.14` meant scrolling past
 * everything before it. Now the page opens as ten module rows, search matches
 * title or id across all of them, and a module opens only when it is relevant.
 */

export type AdminLessonRow = {
  id: string;
  title: string;
  status: "published" | "draft" | "default";
  /** Resolved on the server: edit an existing CMS row, or seed a new one. */
  href: string;
};

export type AdminLessonModule = {
  id: string;
  title: string;
  lessons: AdminLessonRow[];
};

type StatusFilter = "all" | "edited" | "draft";

const STATUS_LABEL: Record<AdminLessonRow["status"], string> = {
  published: "פורסם",
  draft: "טיוטה",
  default: "ערוך",
};

const STATUS_DOT: Record<AdminLessonRow["status"], string> = {
  published: "bg-emerald-500",
  draft: "bg-amber-500",
  default: "bg-line",
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "הכול" },
  { id: "edited", label: "נערכו" },
  { id: "draft", label: "טיוטות" },
];

function matchesStatus(lesson: AdminLessonRow, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "edited") return lesson.status !== "default";
  return lesson.status === "draft";
}

export function AdminLessonBrowser({ modules }: { modules: AdminLessonModule[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const trimmed = query.trim().toLowerCase();
  const searching = trimmed.length > 0 || filter !== "all";

  const visible = useMemo(
    () =>
      modules
        .map((mod) => ({
          ...mod,
          lessons: mod.lessons.filter(
            (lesson) =>
              matchesStatus(lesson, filter) &&
              (!trimmed ||
                lesson.title.toLowerCase().includes(trimmed) ||
                lesson.id.toLowerCase().includes(trimmed)),
          ),
        }))
        .filter((mod) => mod.lessons.length > 0),
    [modules, trimmed, filter],
  );

  const matchCount = visible.reduce((sum, mod) => sum + mod.lessons.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם שיעור או מזהה…"
          aria-label="חיפוש שיעור"
          className="min-w-0 flex-1 rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <div className="flex gap-1" role="group" aria-label="סינון לפי מצב">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-control px-3 py-2 text-sm transition",
                filter === f.id
                  ? "bg-primary text-white"
                  : "border border-line bg-paper text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {searching ? (
        <p className="text-xs text-muted">
          {matchCount === 0
            ? "אין שיעורים תואמים"
            : matchCount === 1
              ? "שיעור אחד תואם"
              : `${matchCount} שיעורים תואמים`}
        </p>
      ) : null}

      <div className="divide-y divide-line rounded-surface border border-line bg-paper">
        {visible.map((mod) => {
          const open = searching || openIds.includes(mod.id);
          const edited = mod.lessons.filter((l) => l.status !== "default").length;
          return (
            <div key={mod.id}>
              <button
                type="button"
                onClick={() =>
                  setOpenIds((prev) =>
                    prev.includes(mod.id) ? prev.filter((x) => x !== mod.id) : [...prev, mod.id],
                  )
                }
                aria-expanded={open}
                disabled={searching}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-surface-low disabled:cursor-default"
              >
                <span
                  aria-hidden
                  className={cn(
                    "text-muted transition-transform",
                    open ? "rotate-90" : "rotate-0",
                  )}
                >
                  ‹
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{mod.title}</span>
                {edited > 0 ? (
                  <span className="text-xs text-primary">{edited} נערכו</span>
                ) : null}
                <span className="text-xs tabular-nums text-muted">{mod.lessons.length}</span>
              </button>

              {open ? (
                <ul className="divide-y divide-line/70 border-t border-line/70">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={lesson.href}
                        className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-low"
                      >
                        <span
                          aria-hidden
                          className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[lesson.status])}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">{lesson.title}</span>
                          <span className="block truncate text-[11px] text-muted" dir="ltr">
                            {lesson.id}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {STATUS_LABEL[lesson.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> פורסם — מוצג לתלמידים
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> טיוטה — רק אתה רואה
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-line" /> ברירת מחדל — התוכן מהריפו
        </span>
      </div>
    </div>
  );
}
