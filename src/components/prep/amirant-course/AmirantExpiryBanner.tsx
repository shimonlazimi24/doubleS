"use client";

import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";

type Props = {
  expiresAt: string | null;
};

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function AmirantExpiryBanner({ expiresAt }: Props) {
  if (!expiresAt) return null;

  const days = daysUntil(expiresAt);

  if (days > 3) return null;

  const expired = days <= 0;
  const expireDate = new Date(expiresAt).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
  });

  return (
    <div
      dir="rtl"
      className={`rounded-2xl border px-5 py-4 ${
        expired
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">
            {expired
              ? "הגישה לקורס פגה"
              : days === 1
              ? "הגישה לקורס פוגה מחר!"
              : `הגישה לקורס פוגה בעוד ${days} ימים (${expireDate})`}
          </p>
          <p className="mt-0.5 text-sm opacity-80">
            {expired
              ? "הארך גישה כדי להמשיך מהנקודה שעצרת — ההתקדמות שמורה."
              : "הארך עכשיו לפני שההתקדמות תיחסם."}
          </p>
        </div>
        <Link
          href={`${PREP_BASE}/pricing`}
          className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            expired
              ? "bg-red-700 text-white hover:bg-red-800"
              : "bg-amber-600 text-white hover:bg-amber-700"
          }`}
        >
          הארך גישה ←
        </Link>
      </div>
    </div>
  );
}
