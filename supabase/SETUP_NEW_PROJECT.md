# Setting up a fresh Supabase project

Run these in the Supabase **SQL Editor**, in this order. Each file is idempotent
(`create table if not exists`, `drop policy if exists`), so re-running is safe.

Choose region **Central EU (Frankfurt)** when creating the project — the app's
Vercel functions run there, and every authenticated page makes at least two
round trips to the database before it renders.

## Order

| # | File | What it creates |
|---|------|-----------------|
| 1 | `amirant-production-mvp-schema.sql` | course entitlements, quiz + simulation attempts, adaptive state, RAG chunks, `match_course_content_chunks` |
| 2 | `amirant-course-progress-schema.sql` | `amirant_lesson_progress` |
| 3 | `migrations/20260819_amirant_lesson_progress.sql` | progress table fixes (text lesson ids) |
| 4 | `cms-schema.sql` | `cms_modules`, `cms_lessons`, `cms_questions` |
| 5 | `migrations/20260817_cms_rls_app_metadata.sql` | CMS admin policies read `app_metadata`, not `user_metadata` |
| 6 | `migrations/20260817_restrict_course_chunks.sql` | closes public read on RAG chunks |
| 7 | `payments-schema.sql` | `prep_payments`, `grant_course_days` |
| 8 | `prep-learner-onboarding-schema.sql` | onboarding answers |
| 9 | `site-settings-schema.sql` | `prep_site_settings` + the `site-media` storage bucket |
| 10 | `grant-admin.sql` | grant yourself admin (edit the email first) |

Steps 5 and 6 are security fixes, not optional. Running 4 without 5 leaves the
CMS policies keyed on `user_metadata`, which any signed-in user can write to
themselves.

## Not included, on purpose

`adaptive-learning-schema.sql`, `learning-intelligence-schema.sql` and
`fix-quiz-questions-difficulty-1-6.sql` define tables the application never
queries. They are left out of a fresh setup rather than carried forward.

## After the SQL

1. Copy the new **URL**, **anon key** and **service_role key** into Vercel:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` — Production scope.
2. Enable the Google provider under Authentication → Providers, and add the
   redirect URLs (see `docs/SUPABASE_AUTH_SETUP.md`).
3. Redeploy.
4. Verify with `npm run verify:new-project` (see scripts/verify-new-project.mjs)
   — it checks every table the app queries actually exists and is reachable.
5. Sign in once, then run `grant-admin.sql` for your own email and sign in again;
   the admin flag only enters the token on a fresh sign-in.
