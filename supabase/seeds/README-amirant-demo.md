# Amirant E2E demo seed

## What gets created

| Artifact | Details |
|----------|---------|
| Category | `amirant-prep` |
| Course | slug `amirant-demo`, id in `src/lib/prep/amirant-demo/seed-constants.ts` |
| Modules | 2 (יסודות · מיומנויות מבחן) |
| Lessons | 6 — mix of **video**, **text**, **mixed** (practice / exam wrapper) |
| Topics | `vocabulary`, `reading_comprehension`, `sentence_completion` |
| Subtopics | academic verbs, synonyms, main idea, inference, connectors, collocations |
| Quiz | 1 quiz on the **last lesson** (מבחן דמו מלא), 45 min suggested, pass 60% |
| Questions | **23** MCQ (`single_choice`), difficulty **1–6** in bank; short demo: app-side filter + length (see `AMIRANT_DEMO_SHORT_QUIZ_*` in `demo-course-content.ts`) |
| Options | 4 per question, **exactly one** `is_correct = true` (server-side truth) |

Stable UUIDs are shared between SQL and TypeScript (`AMIRANT_DEMO_IDS`) for tests and deep links.

## Prerequisites

1. Apply base schema: `supabase/learning-intelligence-schema.sql`
2. (Optional, for adaptive tables) `supabase/adaptive-learning-schema.sql`

## Apply seed

**Supabase SQL editor:** paste and run `amirant-demo.sql`.

**CLI (local Postgres / `psql`):**

```bash
psql "$DATABASE_URL" -f supabase/seeds/amirant-demo.sql
```

**Supabase CLI:**

```bash
supabase db execute -f supabase/seeds/amirant-demo.sql
```

Re-running is mostly idempotent (`ON CONFLICT (id) DO NOTHING` on fixed PKs). If you change content, delete demo rows or adjust IDs in both SQL and `seed-constants.ts`.

## Optional learner + analytics sample

Edit and run `amirant-demo-learner-sample.sql` after replacing `YOUR-USER-UUID-HERE` with a real `auth.users.id`.

For **events** and **attempts**, use the app `LearningService` (server) — do not hand-insert `quiz_attempt_answers.is_correct` without the same logic the service uses.

---

## How to verify flows (end-to-end)

### 1. Open course

- Query: `select id, title from courses where slug = 'amirant-demo';`
- Or use constant `AMIRANT_DEMO_IDS.course` in code to render a course page when you build it.

### 2. Open lesson

- List: `select id, title, kind from lessons where module_id in (...)` using module IDs from `seed-constants`.
- **Video** rows have `video_storage_path` (placeholder path — replace with real storage in prod).

### 3. Start quiz

- `LearningService.startQuizAttempt({ userId, quizId: AMIRANT_DEMO_IDS.quiz })`
- Expect `quiz_started` event if you wire `emitEvent` after persistence.

### 4. Answer questions

- `LearningService.submitAnswer` with `selectedOptionId` from `question_options.id` (see seed: options `201`–`248`).
- Correctness is **computed from DB**, not from the client.

### 5. Adaptive next-question selection

- Load a **pool** of `QuestionPoolItem` from `quiz_questions` + difficulty + topic (query or static list from seed).
- Call `selectNextQuestion` from `@/lib/learning-intelligence/adaptive` with `targetLevel` from `learner_adaptive_topic_state.current_level` (after you persist adaptive state).

### 6. Submit quiz

- `LearningService.submitQuiz({ userId, attemptId })` — score and `passed` are **server-side**.

### 7. Weak topics

- After enough answers per subtopic, aggregate `learner_subtopic_stats` (or compute from events) and run `buildSubtopicMasteryView` + `rankWeakestSubtopics`.

### 8. Recommendations

- `buildRecommendations` from `personalization.ts` with `topicStats` from your analytics rollup.

### 9. AI explanation / helper

- Build `AiTutorGrounding` via `mergeTutorRequest` + RAG on lesson bodies; **never** let the model set official score — only explain using `question` + options + analytics snapshot.

---

## Cleanup

Delete by course id (respect FK order: options → questions → quiz → lessons → modules → topics/subtopics → course → category), or truncate in dev only.
