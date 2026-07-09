"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { captureUtmParams } from "@/lib/prep/analytics";

/** לוכד utm_* לעוגייה בכל כניסה עם פרמטרי קמפיין - לשיוך רכישות. */
export function PrepUtmCapture() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const s = searchParams.toString();
    if (s.includes("utm_")) captureUtmParams(`?${s}`);
  }, [searchParams]);
  return null;
}
