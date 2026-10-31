"use client";

import { useMemo, useState } from "react";
import type { AccessState, AdminLearnerRow } from "@/lib/prep/admin/learner-rows";
import { AdminButton, AdminInput, AdminSegmented } from "./admin-ui";

type AccessFilter = "all" | "paid" | "unpaid";
type OnboardingFilter = "all" | "done" | "missing";

const ACCESS_FILTERS: { id: AccessFilter; label: string }[] = [
  { id: "all", label: "הכול" },
  { id: "paid", label: "בתשלום" },
  { id: "unpaid", label: "בלי גישה" },
];

const ONBOARDING_FILTERS: { id: OnboardingFilter; label: string }[] = [
  { id: "all", label: "הכול" },
  { id: "done", label: "מילאו שאלון" },
  { id: "missing", label: "לא מילאו" },
];

const ACCESS_LABEL: Record<AccessState, string> = {
  paid: "בתשלום",
  admin: "אדמין",
  expired: "פג תוקף",
  none: "אין",
};

const PAGE = 100;

function day(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function examLabel(row: AdminLearnerRow): string {
  if (!row.onboardedAt) return "";
  if (row.examDateUnknown || !row.examDate) return "טרם נקבע";
  return day(row.examDate);
}

function accessLabel(row: AdminLearnerRow): string {
  const label = ACCESS_LABEL[row.access];
  return row.accessEndsAt && row.access !== "none" ? `${label} · עד ${day(row.accessEndsAt)}` : label;
}

function toCsv(rows: AdminLearnerRow[]): string {
  const header = [
    "מייל",
    "נרשם",
    "כניסה אחרונה",
    "מילא שאלון",
    "תאריך מבחן",
    "ניסיון קודם",
    "זמן לימוד יומי",
    "מוסד",
    "תחום",
    "מאיפה הגיעו",
    "גישה",
  ];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.email,
        day(r.signedUpAt),
        day(r.lastSignInAt),
        day(r.onboardedAt),
        examLabel(r),
        r.firstTime,
        r.dailyStudyTime,
        r.institution,
        r.field,
        r.heardAbout,
        accessLabel(r),
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function AdminLearnerTable({ rows }: { rows: AdminLearnerRow[] }) {
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<AccessFilter>("all");
  const [onboarding, setOnboarding] = useState<OnboardingFilter>("all");
  const [shown, setShown] = useState(PAGE);

  // Old sign-ups answered a longer questionnaire; show those columns only when someone did.
  const hasLegacy = useMemo(() => rows.some((r) => r.institution || r.field || r.heardAbout), [rows]);

  const trimmed = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const paid = row.access === "paid" || row.access === "admin";
        if (access === "paid" && !paid) return false;
        if (access === "unpaid" && paid) return false;
        if (onboarding === "done" && !row.onboardedAt) return false;
        if (onboarding === "missing" && row.onboardedAt) return false;
        if (!trimmed) return true;
        return [row.email, row.institution, row.field].join(" ").toLowerCase().includes(trimmed);
      }),
    [rows, trimmed, access, onboarding],
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

  const page = visible.slice(0, shown);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AdminInput
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="חיפוש לפי מייל"
          aria-label="חיפוש נרשם לפי מייל"
          className="min-w-0 flex-1 basis-56"
        />
        <AdminSegmented
          label="סינון לפי גישה"
          options={ACCESS_FILTERS}
          value={access}
          onChange={(v) => {
            setAccess(v);
            setShown(PAGE);
          }}
        />
        <AdminSegmented
          label="סינון לפי שאלון"
          options={ONBOARDING_FILTERS}
          value={onboarding}
          onChange={(v) => {
            setOnboarding(v);
            setShown(PAGE);
          }}
        />
        <AdminButton onClick={downloadCsv} disabled={visible.length === 0}>
          ייצוא CSV
        </AdminButton>
      </div>

      <p className="text-xs text-muted" aria-live="polite">
        {visible.length === rows.length
          ? `${rows.length} חשבונות`
          : `${visible.length} מתוך ${rows.length} חשבונות`}
      </p>

      {visible.length === 0 ? (
        <p className="border-y border-line py-8 text-center text-sm text-muted">
          {rows.length === 0 ? "עוד אף אחד לא נרשם." : "אין חשבונות שמתאימים לסינון."}
        </p>
      ) : (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">מייל</th>
                <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">נרשם</th>
                <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">שאלון</th>
                <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">מבחן</th>
                <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">פעם ראשונה</th>
                <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">זמן ביום</th>
                {hasLegacy ? (
                  <th scope="col" className="whitespace-nowrap py-2 pe-4 text-start font-medium">מוסד · תחום</th>
                ) : null}
                <th scope="col" className="whitespace-nowrap py-2 text-start font-medium">גישה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {page.map((row) => (
                <tr key={row.userId} className="align-top">
                  <td className="py-2.5 pe-4 text-ink" dir="ltr" style={{ textAlign: "right" }}>
                    {row.email || row.userId.slice(0, 8)}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pe-4 tabular-nums text-muted">{day(row.signedUpAt)}</td>
                  <td className="whitespace-nowrap py-2.5 pe-4 tabular-nums">
                    {row.onboardedAt ? (
                      <span className="text-muted">{day(row.onboardedAt)}</span>
                    ) : (
                      <span className="text-ink">לא מילא</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pe-4 tabular-nums text-ink">{examLabel(row)}</td>
                  <td className="py-2.5 pe-4 text-muted">{row.firstTime}</td>
                  <td className="whitespace-nowrap py-2.5 pe-4 text-muted">{row.dailyStudyTime}</td>
                  {hasLegacy ? (
                    <td className="py-2.5 pe-4 text-muted">
                      {[row.institution, row.field].filter(Boolean).join(" · ")}
                    </td>
                  ) : null}
                  <td
                    className={
                      row.access === "paid" || row.access === "admin"
                        ? "whitespace-nowrap py-2.5 font-semibold text-ink"
                        : "whitespace-nowrap py-2.5 text-muted"
                    }
                  >
                    {accessLabel(row)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > shown ? (
        <AdminButton onClick={() => setShown((n) => n + PAGE)}>
          עוד {Math.min(PAGE, visible.length - shown)} מתוך {visible.length - shown} שנותרו
        </AdminButton>
      ) : null}
    </div>
  );
}
