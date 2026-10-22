import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/prep/auth/",
          "/prep/dashboard",
          "/prep/settings",
          "/prep/onboarding",
          "/prep/checkout/",         // payment return pages - per-order, never a landing page
          "/prep/recommendations",   // redirects into the course
          "/prep/amirant/continue",  // funnel redirect (login -> onboarding -> course)
          "/prep/admin/",            // admin panel - never index
          "/prep/amirant/course/",   // course pages require login - no SEO value
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/prep/sitemap.xml`,
  };
}
