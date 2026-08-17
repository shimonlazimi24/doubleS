"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PREP_BASE } from "@/lib/prep/constants";

const DEFAULT_COURSE = `${PREP_BASE}/amirant/course`;

/** Prefer sessionStorage next from pricing; fall back to course home. */
export function CheckoutSuccessContinueLink() {
  const [href, setHref] = useState(DEFAULT_COURSE);

  useEffect(() => {
    try {
      const next = sessionStorage.getItem("prep_checkout_next");
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        setHref(next);
        sessionStorage.removeItem("prep_checkout_next");
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Link
      href={href}
      className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white shadow-card transition hover:opacity-90"
    >
      כניסה לקורס ←
    </Link>
  );
}
