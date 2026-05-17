/**
 * Dev-only: generate a magic-link URL without sending email (bypasses OTP rate limit).
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

const redirectTo = `${siteBase}/prep/auth/complete?next=${encodeURIComponent("/prep/amirant/continue")}`;

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

const link = data.properties?.action_link;
if (!link) {
  console.error("No action_link in response");
  process.exit(1);
}

console.log("\nOpen this link in the same browser you use for testing:\n");
console.log(link);
console.log("\nRedirect after login:", redirectTo);
console.log("");
