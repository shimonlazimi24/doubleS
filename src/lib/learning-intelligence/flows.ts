/**
 * End-to-end flows (orchestration — implement in Next.js Route Handlers / Server Actions).
 *
 * ## Lesson flow
 * 1. Client opens lesson → POST upsert `lesson_progress` (in_progress) if first open.
 * 2. Emit `lesson_started` (dedupe optional).
 * 3. Video: on play → `video_started`; periodic → `video_progressed` + update `last_video_position_sec`.
 * 4. On threshold (e.g. 95% duration) or manual complete → set `lesson_progress.completed`, emit `lesson_completed`, `video_completed`.
 * 5. Job: refresh `student_profiles_summary` / completion metrics.
 *
 * ## Quiz flow
 * 1. Start → insert `quiz_attempts` (submitted_at null) → emit `quiz_started`.
 * 2. Each answer → insert `quiz_attempt_answers` with deterministic `is_correct` → emit `question_answered` + `answer_correct` | `answer_wrong`.
 * 3. Submit → compute `score_pct`, `passed` in app → update attempt row → emit `quiz_submitted` (metadata may snapshot score).
 * 4. Job: update `learner_topic_stats` from answers joined to `quiz_questions.topic_id`.
 *
 * ## AI explanation flow (after quiz)
 * 1. Load attempt + questions + options + authoritative `is_correct` from DB.
 * 2. Retrieve RAG chunks for question/topic (versioned lesson content).
 * 3. Call LLM with JSON schema `QuizExplanationOutput`; validate output does not contradict `is_correct`.
 * 4. Insert `ai_artifacts` only; never update `quiz_attempt_answers`.
 *
 * Ordering rule: domain write → then event emit (same transaction or outbox) to avoid orphan events.
 */

export {};
