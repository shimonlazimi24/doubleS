/**
 * prePare — `/prep` product routes and middleware helpers.
 */

export {
  PREP_BRAND_LATIN,
  PREP_BRAND_NAV_HE,
  PREP_PRODUCT_NAME,
  PREP_COURSES,
} from "@/lib/prep/brand";

import { PREP_COURSES } from "@/lib/prep/brand";

export const PREP_BASE = "/prep";

export const PREP_MARKETING_SLUGS = [
  "toefl",
  "amirant",
  "pricing",
  "blog",
  "about",
  "contact",
  "privacy",
  "login",
] as const;

export type PrepMarketingSlug = (typeof PREP_MARKETING_SLUGS)[number];

export function isPrepMarketingSlug(value: string): value is PrepMarketingSlug {
  return (PREP_MARKETING_SLUGS as readonly string[]).includes(value);
}

/** Public marketing + auth entry (no Supabase session required). */
export const PREP_PUBLIC_PATHS = new Set<string>([
  `${PREP_BASE}`,
  `${PREP_BASE}/toefl`,
  `${PREP_BASE}/amirant`,
  `${PREP_BASE}/courses`,
  `${PREP_BASE}/pricing`,
  `${PREP_BASE}/blog`,
  `${PREP_BASE}/about`,
  `${PREP_BASE}/contact`,
  `${PREP_BASE}/privacy`,
  `${PREP_BASE}/login`,
  `${PREP_BASE}/auth/callback`,
  `${PREP_BASE}/onboarding`,
]);

/** Paths that require a Supabase session (see middleware). */
export const PREP_PROTECTED_PREFIXES = [
  `${PREP_BASE}/dashboard`,
  `${PREP_BASE}/recommendations`,
  `${PREP_BASE}/settings`,
] as const;

export function isPrepPublicPath(pathname: string): boolean {
  if (PREP_PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith(`${PREP_BASE}/blog/`)) return true;
  return false;
}

export function isPrepProtectedPath(pathname: string): boolean {
  return PREP_PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function getSchedulingSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SCHEDULING_SITE_URL?.trim() ?? "";
}

export function getArmyPrepExternalUrl(): string {
  const raw = process.env.NEXT_PUBLIC_ARMY_PREP_URL?.trim();
  if (raw && (raw.startsWith("https://") || raw.startsWith("http://"))) return raw;
  return "https://pazatsta.co.il/";
}

/** קישורי תת-תפריט «קורסים». */
export const PREP_LEARNING_NAV = PREP_COURSES.filter((c) => c.status === "live").map((c) => ({
  href: c.href,
  label: c.shortTitle,
})) as readonly { href: string; label: string }[];
