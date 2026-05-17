/**
 * Canonical public origin (metadata, llms.txt, OG URLs).
 * Prefer NEXT_PUBLIC_APP_URL; on Vercel use VERCEL_URL when unset.
 */
export function getPublicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
