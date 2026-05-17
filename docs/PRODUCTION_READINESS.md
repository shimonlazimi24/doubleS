# Production Readiness Checklist

This checklist covers the Amirant production stack: content QA gate, adaptive telemetry, AI safety, vector retrieval, migrations, Sentry, and E2E.

## 1) Environment Variables

Required in production:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN`)

Recommended:

- `OPENAI_EMBEDDING_MODEL` (defaults to `text-embedding-3-small`)
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ENVIRONMENT`

Reference: `.env.example`.

## 2) Migrations / Database

Apply SQL in this order:

1. `supabase/amirant-production-mvp-schema.sql`
2. Any follow-up patch SQL files in `supabase/` (if added later).

Key production requirements from schema:

- `course_content_chunks.embedding vector(1536)`
- `match_course_content_chunks(...)` RPC
- RLS enabled for user-owned tables
- authenticated read policy for `course_content_chunks`

## 3) RLS Verification

Must pass:

- User A cannot read/write User B data in:
  - `amirant_quiz_attempts`
  - `amirant_quiz_answers`
  - `amirant_simulation_attempts`
  - `amirant_simulation_sections`
  - `amirant_learning_events`
  - `amirant_adaptive_state`
  - `amirant_topic_rollups`
  - `amirant_cross_test_state`
  - `amirant_ai_insights`
- `course_content_chunks` readable by authenticated users only.
- `course_entitlements` scoped by `auth.uid()`.

## 4) Sentry Integration

Integrated files:

- `next.config.mjs` (`withSentryConfig`)
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

Enable DSN in env to activate runtime reporting.

## 5) AI Route Rate Limiting

Placeholder limiter is in:

- `src/lib/amirant-course/ai/rate-limit.ts`

Routes wired:

- `/api/prep/amirant-course/ai/lesson-chat`
- `/api/prep/amirant-course/ai/quiz-review`
- `/api/prep/amirant-course/ai/recommendations`
- `/api/prep/amirant-course/ai/coach-summary`
- `/api/prep/amirant-course/ai-analysis`

Current implementation is in-memory (single-instance). Replace with Redis/durable store before multi-instance scale.

## 6) Embeddings + Vector Retrieval

Sync content embeddings:

```bash
npm run embeddings:amirant-sync
```

This ingests:

- lesson text
- question explanations

into `course_content_chunks` with metadata (`lessonId`, `topic`, source tags).

## 7) E2E Tests (Playwright)

Install browser once:

```bash
npm run test:e2e:install
```

Run:

```bash
npm run test:e2e
```

Covered specs:

- auth redirect
- lesson flow
- adaptive quiz
- AI endpoints

## 8) Content QA Gate

Run:

```bash
npm run qa:amirant-content
```

Hard gate conditions:

- `critical_issue == 0`
- `pass >= 85%`
- `missing explanations == 0`
- `duplicate options == 0`
- repeated-template threshold pass

If it fails, use:

- `reports/amirant-content-critical-fix-plan.md`

## 9) RAG Health Gate

Run:

```bash
npm run rag:amirant-health
```

Must report:

- non-zero chunk count
- non-zero embedding count
- vector RPC available

See runbook: `docs/RAG_OPERATIONS.md`

## 10) Secrets Hygiene

Run:

```bash
npm run security:preflight
```

Review:

- `SECURITY_SETUP.md`
- `.env.example` placeholders only
