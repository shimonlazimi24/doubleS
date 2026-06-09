import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/prep/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/prep",
        disallow: [
          "/prep/auth/",
          "/prep/dashboard",
          "/prep/settings",
          "/prep/onboarding",
          "/prep/amirant/course/",   // course pages require login — no SEO value
        ],
      },
    ],
    sitemap: `${base}/prep/sitemap.xml`,
  };
}
