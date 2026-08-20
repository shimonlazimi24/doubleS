"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readPrepCookieConsent,
  writePrepCookieConsent,
  type PrepCookieConsent,
} from "@/lib/prep/cookie-consent";
import { PREP_BASE } from "@/lib/prep/constants";

/**
 * באנר תחתון להסכמת עוגיות מדידה/שיווק (GA).
 * Auth/session נשארים תמיד; GA נטען רק אחרי «מאשר/ת».
 */
export function PrepCookieConsentBanner() {
  const [choice, setChoice] = useState<PrepCookieConsent | null | "pending">("pending");

  useEffect(() => {
    setChoice(readPrepCookieConsent());
  }, []);

  if (choice === "pending" || choice !== null) return null;

  function decide(next: PrepCookieConsent) {
    writePrepCookieConsent(next);
    setChoice(next);
    if (next === "all") {
      window.dispatchEvent(new Event("prep-cookie-consent"));
    }
  }

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="הסכמת עוגיות"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-paper/95 px-4 py-4 shadow-[0_-8px_24px_rgba(15,35,71,0.08)] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm leading-relaxed text-muted">
          אנחנו משתמשים בעוגיות חיוניות להתחברות, ובעוגיות מדידה (Google Analytics) לשיפור האתר
          ושיוך קמפיינים — רק אם תאשרו.{" "}
          <Link href={`${PREP_BASE}/privacy`} className="font-medium text-accent underline-offset-2 hover:underline">
            מדיניות פרטיות
          </Link>
          {" · "}
          <Link href={`${PREP_BASE}/terms`} className="font-medium text-accent underline-offset-2 hover:underline">
            תקנון
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-line bg-paper px-4 text-sm font-semibold text-primary transition hover:border-primary/35"
          >
            חיוניות בלבד
          </button>
          <button
            type="button"
            onClick={() => decide("all")}
            className="inline-flex min-h-10 items-center justify-center rounded-control bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            מאשר/ת
          </button>
        </div>
      </div>
    </div>
  );
}
