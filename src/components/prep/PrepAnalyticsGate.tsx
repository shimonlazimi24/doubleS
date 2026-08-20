"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";
import { hasPrepMarketingConsent } from "@/lib/prep/cookie-consent";

/** טוען GA רק אחרי הסכמת מדידה/שיווק. */
export function PrepAnalyticsGate({ gaId }: { gaId: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    function sync() {
      setAllowed(hasPrepMarketingConsent());
    }
    sync();
    window.addEventListener("prep-cookie-consent", sync);
    return () => window.removeEventListener("prep-cookie-consent", sync);
  }, []);

  if (!allowed || !gaId) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
