/**
 * Dev-only: generate login URLs without sending email (bypasses OTP rate limit).
 *
 *   npm run prep:login-link -- you@example.com
 *   npm run prep:login-link -- you@example.com https://double-s.vercel.app
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Settings → API → service_role — never commit)
 */
import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const email = process.argv[2]?.trim();
const siteBase = (process.argv[3] || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!email || !email.includes("@")) {
  console.error("Usage: npm run prep:login-link -- <email> [site-base-url]");
  process.exit(1);
}

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const nextPath = "/prep/amirant/continue";
const redirectTo = `${siteBase}/prep/auth/complete?next=${encodeURIComponent(nextPath)}`;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo },
});

if (error) {
  console.error("generateLink failed:", error.message);
  process.exit(1);
}

const hashed = data.properties?.hashed_token;
const otpType = data.properties?.verification_type || "magiclink";
const actionLink = data.properties?.action_link;

if (hashed) {
  const direct = new URL(`${siteBase}/prep/auth/complete`);
  direct.searchParams.set("token_hash", hashed);
  direct.searchParams.set("type", otpType === "signup" ? "signup" : "magiclink");
  direct.searchParams.set("next", nextPath);
  console.log("\n=== קישור ישיר לאתר (מומלץ לבדיקה — בלי PKCE) ===\n");
  console.log(direct.toString());
}

if (actionLink) {
  console.log("\n=== קישור דרך Supabase (אחרי לחיצה אמור להגיע עם #access_token) ===\n");
  console.log(actionLink);
}

console.log("\nודאו ב-Supabase → Redirect URLs:", `${siteBase}/prep/auth/complete`);
console.log("");
