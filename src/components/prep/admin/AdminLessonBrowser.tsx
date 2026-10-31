"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/design-system/cn";
import { AdminInput, AdminSegmented } from "./admin-ui";

/**
 * Finding one lesson among the whole course.
 *
 * The page opens as one row per module; search matches title or id across all
 * of them, and a module opens only when it is relevant.
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
  default: "מקבצי הקורס",
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
        <AdminInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם שיעור או מזהה"
          aria-label="חיפוש שיעור"
          className="min-w-0 flex-1 basis-56"
        />
        <AdminSegmented label="סינון לפי מצב" options={FILTERS} value={filter} onChange={setFilter} />
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

      <div className="divide-y divide-line border-y border-line">
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
                className="flex min-h-12 w-full items-center gap-3 px-2 py-3 text-start transition hover:bg-surface-low disabled:cursor-default"
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
                        className="flex min-h-12 items-center gap-3 py-2.5 pe-2 ps-8 transition hover:bg-surface-low"
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
          <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" /> פורסם: מוצג לתלמידים
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" /> טיוטה: נשמרה, התלמידים עדיין רואים את קבצי הקורס
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-line" /> בלי עריכה: התוכן מקבצי הקורס
        </span>
      </div>
    </div>
  );
}
