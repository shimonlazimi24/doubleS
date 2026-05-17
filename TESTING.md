# Testing — Amirant Preparation (`/prep/amirant/course`)

This document describes how to exercise the **Amirant Preparation** course: structured lessons, practice, adaptive quizzes, full simulations, analytics, and the grounded AI summary endpoint.

## Preconditions

- Run the Next app locally (`npm run dev` or your usual command).
- Open a private/incognito window if you want a clean `localStorage` state.

## 1. Open the course

1. Navigate to `https://<host>/prep/amirant/course` (or `http://localhost:3000/prep/amirant/course`).
2. Confirm the nine modules render and that simulation links appear.

## 2. Course & lesson progress (Supabase when authenticated, local fallback)

1. On the home hero, check **התקדמות בקורס** (completed / total, percent).
2. The layout header shows a compact **התקדמות** bar (`completedLessons` / `totalLessons` · `percentComplete%`).
3. Open a lesson: it is marked **started** on load; use **סימון שיעור כהושלם** to mark **completed** (intentional, avoids guessing completion from scroll time).
4. In the curriculum list, lesson index badges: **emerald** border = completed, **amber** = started only, default = not started (hover the badge for a `title` tooltip).
5. Refresh the page — state should persist.
6. **Authenticated flow**: after login, verify rows are upserted in `amirant_lesson_progress` with:
   - `lesson_id`
   - `user_id`
   - `status`
   - `started_at`
   - `completed_at`
   - `updated_at`
7. **Fallback flow**: when no session exists, progress stays in `localStorage` key `amirant-course:progress:v1`.
8. **RLS two-user check**:
   - Sign in as User A, complete at least one lesson.
   - In a separate browser profile sign in as User B and open the same lesson.
   - User B should **not** see User A completion state in UI.
   - In SQL editor (or dashboard) verify each user can read only own rows through authenticated client access (policies on `amirant_lesson_progress`).
   - Optional negative check: attempt delete via authenticated client; should fail (no DELETE policy).

## 3. Lessons (structured JSON blocks)

1. Click **התחלת שיעור ראשון** or any lesson row.
2. Confirm sections render as structured blocks (intro, explanation, examples, summary) with **no raw HTML** in the source (content lives in `src/lib/amirant-course/lesson-registry.ts`).
3. Use **תרגול** / **מבחן** links when present.

## 4. Practice set

1. From a module row or lesson sidebar, open a practice set (e.g. warm-up).
2. Answer items and click **שליחה ובדיקה**.
3. Confirm explanations appear after submit and that analytics update (see the Analytics section below).

## 5. Adaptive quiz (16 questions)

1. Open any module quiz (e.g. `…/course/quiz/quiz-vocab`).
2. Note **רמת פתיחה** — it reflects cross-test state from `localStorage` (`nextStartLevelFromCrossTest`).
3. Step through questions; change an earlier answer and confirm forward answers reset (chain rebuild).
4. Observe **רמה נוכחית** updating after graded progression (two correct in a row to level up, two wrong to level down — shared `applyStreakLevelTransition`).
5. Submit with **סיום מבחן** or let the timer expire; confirm results and that a new quiz picks a new opening level after prior performance.

## 6. Full simulation

1. Open `…/course/simulation/sim-01` (or any `sim-0x`).
2. Run **פיילוט** (not scored), then complete each scored section within its timer.
3. Confirm four scored sections sum to **16** questions and **39 minutes** total, matching `src/lib/amirant-course/simulations/definitions.ts`.

## 7. Analytics

1. Go to `…/course/analytics`.
2. Verify per-topic accuracy, weak/strong topic lists (after enough attempts), and the improvement hint from session history.
3. Click **בקשת ניתוח** — the UI calls `POST /api/prep/amirant-course/ai-analysis`, which returns **deterministic** Hebrew text built only from the payload (no invented scores).

## 8. AI / API (no hallucinated numbers)

- The route validates the body with `aiAnalysisRequestSchema` and returns `AiAnalysisResponse` (`{ text, source: "deterministic", model: "none" }` today).
- There is no LLM: text is from `buildDeterministicAnalysisText` only — **no** scores are invented on the server.
- Optional: call the API with `curl` and a JSON body mirroring the client.

## 9. Unit tests (lib)

- Run `npm run test:amirant` — covers streak rules, section level transitions, `buildAdaptiveQuizQuestionIds` (incl. no duplicates + chain divergence), `gradeAdaptiveQuizOutcomes`, analytics rollups, `clampDifficultyLevel`.

## 10. E2E (Playwright)

- Install browser once: `npm run test:e2e:install`
- Run smoke E2E: `npm run test:e2e`
- Specs include auth redirect, lesson flow, adaptive quiz flow, and AI endpoint contract checks.

## 11. Auth / routing

- `/prep/amirant/course` is listed as a **public** prep path in `src/lib/prep/constants.ts` (same pattern as `/prep/amirant/learn`).

## 12. Regression checks

- Typecheck: `npx tsc --noEmit`.
- Compare with marketing demo at `/prep/amirant/learn` — different data source by design.
- Content release gate: `npm run qa:amirant-content` (must pass).
- RAG health gate: `npm run rag:amirant-health`.
- Secrets preflight: `npm run security:preflight`.
