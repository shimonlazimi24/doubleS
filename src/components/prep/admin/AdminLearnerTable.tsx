"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/design-system/cn";

export type AdminLearnerRow = {
  userId: string;
  email: string;
  examDate: string;
  institution: string;
  field: string;
  firstTime: string;
  dailyStudyTime: string;
  heardAbout: string;
  completedAt: string;
  paid: boolean;
  accessEndsAt: string | null;
};

type PaidFilter = "all" | "paid" | "unpaid";

const FILTERS: { id: PaidFilter; label: string }[] = [
  { id: "all", label: "הכול" },
  { id: "paid", label: "שילמו" },
  { id: "unpaid", label: "לא שילמו" },
];

const COLUMNS = [
  "מייל",
  "תאריך מבחן",
  "מוסד",
  "תחום",
  "ניסיון קודם",
  "זמן לימוד יומי",
  "מאיפה הגיעו",
  "מילא/ה",
  "גישה",
];

function toCsv(rows: AdminLearnerRow[]): string {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [COLUMNS.map(escape).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.email,
        r.examDate,
        r.institution,
        r.field,
        r.firstTime,
        r.dailyStudyTime,
        r.heardAbout,
        r.completedAt,
        r.paid ? `שילם${r.accessEndsAt ? ` (עד ${r.accessEndsAt})` : ""}` : "לא שילם",
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function AdminLearnerTable({ rows }: { rows: AdminLearnerRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PaidFilter>("all");

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (filter === "paid" && !row.paid) return false;
        if (filter === "unpaid" && row.paid) return false;
        if (!trimmed) return true;
        return [row.email, row.institution, row.field, row.heardAbout]
          .join(" ")
          .toLowerCase()
          .includes(trimmed);
      }),
    [rows, trimmed, filter],
  );

  function downloadCsv() {
    const blob = new Blob(["﻿", toCsv(visible)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prepare-learners.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי מייל, מוסד או תחום…"
          aria-label="חיפוש נרשם"
          className="min-w-0 flex-1 rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <div className="flex gap-1" role="group" aria-label="סינון לפי תשלום">
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
        <button
          type="button"
          onClick={downloadCsv}
          disabled={visible.length === 0}
          className="rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink transition hover:border-primary disabled:opacity-40"
        >
          ייצוא CSV
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-surface border border-line bg-paper p-6 text-center text-sm text-muted">
          {rows.length === 0 ? "עוד אף אחד לא מילא את השאלון." : "אין נרשמים תואמים."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-surface border border-line bg-paper">
          <table className="w-full min-w-[60rem] text-start text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-low text-xs text-muted">
                {COLUMNS.map((c) => (
                  <th key={c} className="whitespace-nowrap px-3 py-2 text-start font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {visible.map((row) => (
                <tr key={row.userId} className="align-top transition hover:bg-surface-low">
                  <td className="px-3 py-2 text-ink" dir="ltr">
                    {row.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink">{row.examDate}</td>
                  <td className="px-3 py-2 text-ink">{row.institution}</td>
                  <td className="px-3 py-2 text-ink">{row.field}</td>
                  <td className="px-3 py-2 text-muted">{row.firstTime}</td>
                  <td className="px-3 py-2 text-muted">{row.dailyStudyTime}</td>
                  <td className="px-3 py-2 text-muted">{row.heardAbout || "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted">
                    {row.completedAt}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.paid ? (
                      <span className="text-emerald-700">
                        שילם{row.accessEndsAt ? ` · עד ${row.accessEndsAt}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted">לא שילם</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
