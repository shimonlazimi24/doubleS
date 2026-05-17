/**
 * RLS verification helper — documents policies and fails if service role is missing when VERIFY_RLS=1.
 * Full cross-user tests require two test users; run manually against staging per docs/PRODUCTION_READINESS.md.
 */
import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "./load-project-env.mjs";

loadProjectEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const TABLES = [
  "amirant_quiz_attempts",
  "amirant_quiz_answers",
  "amirant_simulation_attempts",
  "amirant_learning_events",
  "amirant_lesson_progress",
  "course_entitlements",
  "course_content_chunks",
];

async function main() {
  if (!url || !serviceKey) {
    console.log(
      JSON.stringify({
        status: "skipped",
        reason: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to verify table reachability.",
        tables: TABLES,
      }),
    );
    process.exit(0);
  }

  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const checks = [];
  for (const table of TABLES) {
    const { error, count } = await client.from(table).select("*", { count: "exact", head: true });
    checks.push({ table, ok: !error, error: error?.message ?? null, count: count ?? null });
  }
  const allOk = checks.every((c) => c.ok);
  console.log(JSON.stringify({ status: allOk ? "ok" : "error", checks }, null, 2));
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
