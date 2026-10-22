"use client";

import { PrepAppLink as Link } from "@/components/prep/PrepAppLink";
import { PREP_BASE } from "@/lib/prep/constants";
import { useAmirantCourseAccess } from "./AmirantCourseAccessProvider";

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far ahead the notice appears. */
const NOTICE_WINDOW_DAYS = 7;

/**
 * One line under the course nav when the learner's paid access ends within
 * the next seven days. Renders nothing otherwise: open-ended access, access
 * already over (the page gates handle that) or no paid access at all.
 */
export function AmirantExpiryBanner() {
  const { endsAt } = useAmirantCourseAccess();
  if (!endsAt) return null;

  const remainingMs = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0 || remainingMs > NOTICE_WINDOW_DAYS * DAY_MS) return null;

  const days = Math.ceil(remainingMs / DAY_MS);
  const endDate = new Date(endsAt).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
  const when = days <= 1 ? "היום" : days === 2 ? "מחר" : `בעוד ${days} ימים`;

  return (
    <p dir="rtl" className="border-b border-line bg-paper px-4 py-2 text-center text-sm text-muted sm:px-6">
      הגישה לקורס מסתיימת {when} ({endDate}).{" "}
      <Link href={`${PREP_BASE}/pricing`} className="font-semibold text-primary underline-offset-4 hover:underline">
        להארכת הגישה
      </Link>
    </p>
  );
}
