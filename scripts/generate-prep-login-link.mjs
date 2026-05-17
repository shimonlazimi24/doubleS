/**
 * Dev: login URL without email (bypasses OTP rate limit).
 *
 *   npm run prep:login-link -- you@example.com https://double-s.vercel.app
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const nextPath = "/prep/amirant/course";
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

const actionLink = data.properties?.action_link;
if (actionLink) {
  const action = new URL(actionLink);
  const rawToken = action.searchParams.get("token");
  const linkType = action.searchParams.get("type") || "email";
  if (rawToken) {
    const verify = new URL(`${siteBase}/prep/auth/verify`);
    verify.searchParams.set("token", rawToken);
    verify.searchParams.set("email", email);
    verify.searchParams.set("type", linkType);
    verify.searchParams.set("next", nextPath);
    console.log("\n=== פתחו את הקישור הזה (התחברות → דף קורס) ===\n");
    console.log(verify.toString());
  }
}

const hashed = data.properties?.hashed_token;
if (hashed) {
  const verify = new URL(`${siteBase}/prep/auth/verify`);
  verify.searchParams.set("token_hash", hashed);
  verify.searchParams.set("email", email);
  verify.searchParams.set("type", "email");
  verify.searchParams.set("next", nextPath);
  console.log("\n=== גיבוי (token_hash) ===\n");
  console.log(verify.toString());
}

console.log("\nSupabase → Redirect URLs:");
console.log(`  ${siteBase}/prep/auth/verify`);
console.log(`  ${siteBase}/prep/auth/complete`);
console.log("\nVercel (שרת): הוסיפו SUPABASE_SERVICE_ROLE_KEY ל-fallback אם verify נכשל.");
console.log("");
