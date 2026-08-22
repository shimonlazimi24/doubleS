/**
 * Checks that a Supabase project has everything this application queries.
 *
 * Run it after setting up a fresh project, before pointing production at it.
 * A missing table does not fail the build or the deploy — it fails silently for
 * a learner mid-shot, which is the worst place to find out.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/verify-new-project.mjs
 */
import { createClient } from "@supabase/supabase-js";

/** Every table reached through `.from(...)` anywhere in src/. */
const TABLES = [
  "amirant_adaptive_state",
  "amirant_ai_insights",
  "amirant_cross_test_state",
  "amirant_learning_events",
  "amirant_lesson_progress",
  "amirant_quiz_answers",
  "amirant_quiz_attempts",
  "amirant_simulation_attempts",
  "amirant_simulation_sections",
  "amirant_topic_rollups",
  "cms_lessons",
  "cms_questions",
  "course_content_chunks",
  "course_entitlements",
  "prep_learner_onboarding",
  "prep_payments",
  "prep_site_settings",
];

/** Every function reached through `.rpc(...)`. */
const FUNCTIONS = ["grant_course_days", "match_course_content_chunks"];

const STORAGE_BUCKETS = ["site-media"];

function env(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name}. See supabase/SETUP_NEW_PROJECT.md.`);
    process.exit(2);
  }
  return v;
}

async function main() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Checking ${url}\n`);
  const missing = [];

  for (const table of TABLES) {
    const { error } = await client.from(table).select("*", { count: "exact", head: true });
    if (error) {
      missing.push(`table  ${table} — ${error.message}`);
      console.log(`  ✗ ${table}`);
    } else {
      console.log(`  ✓ ${table}`);
    }
  }

  console.log();
  for (const fn of FUNCTIONS) {
    // Calling with no arguments: "does not exist" means it is absent, while a
    // complaint about arguments or types means it is there.
    const { error } = await client.rpc(fn, {});
    const absent = error && /could not find|does not exist/i.test(error.message);
    if (absent) {
      missing.push(`function  ${fn} — ${error.message}`);
      console.log(`  ✗ ${fn}()`);
    } else {
      console.log(`  ✓ ${fn}()`);
    }
  }

  console.log();
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  if (bucketError) {
    missing.push(`storage — ${bucketError.message}`);
    console.log(`  ✗ storage: ${bucketError.message}`);
  } else {
    const names = new Set((buckets ?? []).map((b) => b.name));
    for (const bucket of STORAGE_BUCKETS) {
      if (names.has(bucket)) {
        console.log(`  ✓ bucket ${bucket}`);
      } else {
        missing.push(`bucket  ${bucket} — not found`);
        console.log(`  ✗ bucket ${bucket}`);
      }
    }
  }

  console.log();
  if (missing.length === 0) {
    console.log("Everything the application queries is present.");
    return;
  }
  console.error(`${missing.length} missing:\n`);
  for (const line of missing) console.error(`  ${line}`);
  console.error("\nSee supabase/SETUP_NEW_PROJECT.md for the file that creates each one.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
