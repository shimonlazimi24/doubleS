"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { hasPrepMarketingConsent } from "@/lib/prep/cookie-consent";

/**
 * Meta Pixel, loaded only after the visitor accepts measurement cookies and only
 * when NEXT_PUBLIC_META_PIXEL_ID is set. Funnel events reach it through
 * `trackEvent` (see META_EVENT_NAMES in analytics.ts).
 */
export function PrepMetaPixelGate({ pixelId }: { pixelId: string }) {
  const [allowed, setAllowed] = useState(false);
  const pathname = usePathname();
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    function sync() {
      setAllowed(hasPrepMarketingConsent());
    }
    sync();
    window.addEventListener("prep-cookie-consent", sync);
    return () => window.removeEventListener("prep-cookie-consent", sync);
  }, []);

  // The snippet reports the first page itself; later client-side navigations
  // are reported here.
  useEffect(() => {
    if (!allowed) return;
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [allowed, pathname]);

  if (!allowed || !/^\d+$/.test(pixelId)) return null;
  return (
    <Script id="prep-meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  );
}
