/**
 * Static production-readiness checks (no live secrets / DB required).
 * Fails CI if critical hardening artifacts are missing. Answer-key leaks into the
 * browser are caught by `no-bank-in-client.test.ts` (import graph) and
 * `check-client-chunks.mjs` (built chunks); there is no public bank file any more.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];

function mustExist(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) failures.push(`missing: ${rel}`);
  return p;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

// Artifacts from senior hardening
mustExist("src/app/api/prep/amirant-course/grade/route.ts");
// The browser no longer receives the bank: pages get their questions from the server.
mustExist("src/lib/amirant-course/question-bank/for-client.server.ts");
mustExist("src/lib/amirant-course/question-bank/no-bank-in-client.test.ts");
mustExist("scripts/check-client-chunks.mjs");
mustExist("supabase/migrations/20260817_cms_rls_app_metadata.sql");
mustExist("supabase/migrations/20260817_restrict_course_chunks.sql");

const authBypass = read("src/lib/prep/auth-bypass.ts");
if (!authBypass.includes("NODE_ENV") && !authBypass.includes("VERCEL_ENV")) {
  failures.push("auth-bypass must gate on production env");
}

const verify = read("src/app/prep/auth/verify/route.ts");
if (!verify.includes("PREP_AUTH_ADMIN_VERIFY") || !verify.includes("production")) {
  failures.push("auth/verify must block admin-verify fallback in production");
}

const barrel = read("src/lib/amirant-course/index.ts");
if (barrel.includes("AMIRANT_BANK_QUESTIONS") && barrel.includes('from "./question-bank"')) {
  failures.push("amirant-course barrel must not re-export full question bank with keys");
}

if (failures.length) {
  console.error("Production readiness failed:");
  for (const f of failures) console.error(` - ${f}`);
  process.exit(2);
}

console.log("Production readiness checks passed.");
