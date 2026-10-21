#!/usr/bin/env bash
# Copies the application's data from one Supabase project to another.
# See supabase/MIGRATE_TO_FRANKFURT.md. Needs pg_dump and psql (PostgreSQL 17)
# on PATH, and OLD_DB_URL / NEW_DB_URL in the environment (session pooler URLs).
#
# Nothing in the old project is modified. The new project must be empty apart
# from what Supabase creates by itself.
set -euo pipefail

: "${OLD_DB_URL:?set OLD_DB_URL to the old project's session-pooler connection string}"
: "${NEW_DB_URL:?set NEW_DB_URL to the new project's session-pooler connection string}"
command -v pg_dump >/dev/null || { echo "pg_dump not on PATH"; exit 2; }
command -v psql >/dev/null || { echo "psql not on PATH"; exit 2; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# The dump holds user data, so it lives outside the repository.
OUT="${MIGRATION_OUT:-$HOME/.prep-migration}"
mkdir -p "$OUT"
chmod 700 "$OUT"

# The application's tables, in load order (parents before children), so the
# restore needs no superuser tricks to get past foreign keys.
TABLES=(
  auth.users
  auth.identities
  public.course_entitlements
  public.prep_payments
  public.prep_learner_onboarding
  public.amirant_lesson_progress
  public.amirant_quiz_attempts
  public.amirant_quiz_answers
  public.amirant_simulation_attempts
  public.amirant_simulation_sections
  public.amirant_adaptive_state
  public.amirant_topic_rollups
  public.amirant_cross_test_state
  public.amirant_learning_events
  public.amirant_ai_insights
  public.cms_modules
  public.cms_lessons
  public.cms_questions
  public.prep_site_settings
  public.course_content_chunks
)

echo "== 1. schema on the new project (SETUP_NEW_PROJECT.md order)"
for f in \
  supabase/amirant-production-mvp-schema.sql \
  supabase/amirant-course-progress-schema.sql \
  supabase/migrations/20260819_amirant_lesson_progress.sql \
  supabase/cms-schema.sql \
  supabase/migrations/20260817_cms_rls_app_metadata.sql \
  supabase/migrations/20260817_restrict_course_chunks.sql \
  supabase/payments-schema.sql \
  supabase/prep-learner-onboarding-schema.sql \
  supabase/site-settings-schema.sql; do
  echo "   $f"
  psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -q -f "$ROOT/$f"
done

echo "== 2. data dump from the old project"
ARGS=()
for t in "${TABLES[@]}"; do ARGS+=(--table="$t"); done
pg_dump "$OLD_DB_URL" --data-only --no-owner --no-privileges "${ARGS[@]}" -f "$OUT/data.sql"
echo "   $(wc -c < "$OUT/data.sql") bytes → $OUT/data.sql"

echo "== 3. restore into the new project"
psql "$NEW_DB_URL" -v ON_ERROR_STOP=1 -q -f "$OUT/data.sql"

echo "== 4. row counts, old vs new"
for t in "${TABLES[@]}"; do
  o=$(psql "$OLD_DB_URL" -At -c "select count(*) from $t" 2>/dev/null || echo "?")
  n=$(psql "$NEW_DB_URL" -At -c "select count(*) from $t" 2>/dev/null || echo "?")
  flag=""; [ "$o" != "$n" ] && flag="   <-- differs"
  printf "   %-40s %8s %8s%s\n" "$t" "$o" "$n" "$flag"
done

echo "== 5. storage objects in the old project (copy these by hand)"
psql "$OLD_DB_URL" -At -c "select bucket_id || '/' || name from storage.objects order by 1" || true

echo
echo "Done. The dump stays in $OUT (contains user data: delete it when the move is verified)."
