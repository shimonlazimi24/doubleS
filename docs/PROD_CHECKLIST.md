# Production readiness checklist (prePare)

Use before opening getprepared.academy to real traffic.

## 1. Environment (Vercel / host)

Must be **unset / off** in production:

- `PREP_AUTH_BYPASS`
- `PREP_AUTH_ADMIN_VERIFY`
- `NEXT_PUBLIC_PREP_HAS_FULL_ACCESS`
- `PREP_DEV_FAKE_CHECKOUT`

Must be **set**:

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (AI + embeddings)
- Hyp: `HYP_MASOF`, `HYP_API_KEY`, `HYP_PASSP`
- `NEXT_PUBLIC_SITE_URL=https://getprepared.academy`
- Sentry: `NEXT_PUBLIC_SENTRY_DSN` (and server `SENTRY_DSN` if used)

Optional: `AI_HEALTH_SECRET` / `CRON_SECRET` for health checks; `PREP_TESTER_EMAILS` for internal testers.

## 2. Supabase

Already required for this release:

1. `supabase/migrations/20260817_cms_rls_app_metadata.sql` (safe no-op if CMS tables missing)
2. `supabase/migrations/20260817_restrict_course_chunks.sql`

Admin user: `app_metadata.is_admin = true` (Dashboard → Auth → user → raw app_metadata).

## 3. Smoke after deploy

1. `/prep` loads
2. Login (Google / magic link)
3. Onboarding (3 steps) → pricing or course
4. Free intro lesson opens; paid module shows lock without entitlement
5. Adaptive quiz grades (no answer keys in Network → JS bundle / public JSON)
6. Hyp checkout → entitlement → course unlock
7. AI chat only for entitled user
8. `/prep/admin` only for admin

## 4. Automations

```bash
npm run security:preflight
npm run prod:readiness
npm run test:e2e:smoke   # builds + Playwright smoke
```

CI runs `prod:readiness` + quality gates on every `main` push; e2e smoke runs on `main`.
