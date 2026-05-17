# Amirant Release Checklist

Use this as a hard pass/fail gate before production deployment.

## 1) Content QA

- [ ] `npm run qa:amirant-content` passes.
- [ ] `critical_issue == 0`.
- [ ] `pass >= 85%`.
- [ ] Missing explanations: `0`.
- [ ] Duplicate options: `0`.
- [ ] Repeated-template clusters above threshold: `0`.

## 2) Adaptive telemetry

- [ ] Adaptive quiz emits `adaptive_decision` telemetry.
- [ ] Simulation emits `adaptive_decision` telemetry.
- [ ] Weak-topic quiz generation logs telemetry event.
- [ ] Event payload includes topic, previous/selected level, reason, streak, timestamp.

## 3) AI safety

- [ ] Structured outputs enabled on all AI routes.
- [ ] Post-generation numeric grounding validator active.
- [ ] Unsafe outputs are blocked and replaced with safe fallback.
- [ ] Validation failures are logged in AI insights payload.

## 4) RAG health

- [ ] Migration with pgvector + RPC applied.
- [ ] `npm run embeddings:amirant-sync` completed.
- [ ] `npm run rag:amirant-health` returns `healthy`.
- [ ] Retrieval fallback works when embeddings are missing.

## 5) E2E and automated QA

- [ ] `npm run test:amirant` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run test:e2e` passes on CI baseline.
- [ ] E2E covers lesson flow, adaptive quiz flow, analytics, AI endpoint behavior.

## 6) RLS verification

- [ ] User A cannot read/write User B data across Amirant user tables.
- [ ] `course_content_chunks` is readable only under intended policy scope.
- [ ] Lesson progress policies verified.

## 7) Secrets hygiene

- [ ] `.env` and `.env.local` are gitignored.
- [ ] `.env.example` has placeholders only.
- [ ] `npm run security:preflight` passes.
- [ ] `SECURITY_SETUP.md` reviewed by release owner.

## 8) Manual QA

- [ ] Dashboard shows weak/strong topics and next action.
- [ ] Quiz review shows mistakes, explanations, and practice CTA.
- [ ] Analytics page shows trend and AI summary behavior.
- [ ] No broken navigation or dead-end flows.

## Final go/no-go

- [ ] All sections above are green.
- [ ] Release owner sign-off.
