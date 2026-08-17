/**
 * Static production-readiness checks (no live secrets / DB required).
 * Fails CI if critical hardening artifacts are missing or answer keys leak into public bank.
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
mustExist("src/lib/amirant-course/question-bank/client-bank.ts");
mustExist("content/amirant-import/source/questions.public.json");
mustExist("supabase/migrations/20260817_cms_rls_app_metadata.sql");
mustExist("supabase/migrations/20260817_restrict_course_chunks.sql");
mustExist("scripts/generate-questions-public.mjs");

const pkg = JSON.parse(read("package.json"));
const ingest = pkg.scripts?.["ingest:amirant-full"] ?? "";
if (!ingest.includes("generate:questions-public")) {
  failures.push("package.json ingest:amirant-full must chain generate:questions-public");
}

const publicBank = read("content/amirant-import/source/questions.public.json");
for (const leak of ["correctOptionId", "correct_option_id", '"explanation"']) {
  if (publicBank.includes(leak)) {
    failures.push(`questions.public.json must not contain ${leak}`);
  }
}

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
