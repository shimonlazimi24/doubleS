/**
 * LearningService — server-side orchestration for course engine + validated events.
 * Ordering: persist business rows first, then emit events (Zod-validated metadata).
 * Not transactional across Postgres + events: if event insert fails after a write,
 * callers should log/retry; production may wrap in a DB transaction + outbox table.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createLearningEventEnvelope } from "./learning-event-metadata";
import type { CreateLearningEventEnvelopeInput } from "./learning-event-metadata";
import { difficultyToBand, isSelectedOptionCorrect, scorePercentFromCounts } from "./learning-service.helpers";
import type {
  EmitEventInput,
  EmitEventResult,
  LessonProgressSnapshot,
  MarkLessonCompletedInput,
  MarkLessonStartedInput,
  ServiceError,
  ServiceResult,
  StartQuizAttemptInput,
  StartQuizAttemptResult,
  SubmitAnswerInput,
  SubmitAnswerResult,
  SubmitQuizInput,
  SubmitQuizResult,
} from "./learning-service.types";

const uuidStr = z.string().uuid();

function err(
  code: ServiceError["code"],
  message: string,
  cause?: unknown,
  zodError?: ServiceError["zodError"],
): ServiceError {
  return { code, message, cause, zodError };
}

function dbErr(message: string, cause: unknown): ServiceError {
  return err("DB_ERROR", message, cause);
}

export type LearningService = {
  startQuizAttempt(input: StartQuizAttemptInput): Promise<ServiceResult<StartQuizAttemptResult>>;
  submitAnswer(input: SubmitAnswerInput): Promise<ServiceResult<SubmitAnswerResult>>;
  submitQuiz(input: SubmitQuizInput): Promise<ServiceResult<SubmitQuizResult>>;
  markLessonStarted(input: MarkLessonStartedInput): Promise<ServiceResult<LessonProgressSnapshot>>;
  markLessonCompleted(input: MarkLessonCompletedInput): Promise<ServiceResult<LessonProgressSnapshot>>;
  emitEvent(input: EmitEventInput): Promise<ServiceResult<EmitEventResult>>;
};

type QuizNav = {
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  quizId: string;
};

type LessonNav = {
  courseId: string | null;
  moduleId: string | null;
  lessonId: string;
};

async function resolveQuizNav(
  client: SupabaseClient,
  quizId: string,
): Promise<QuizNav | null> {
  const { data: quiz, error: qe } = await client
    .from("quizzes")
    .select("id, lesson_id")
    .eq("id", quizId)
    .maybeSingle();
  if (qe) throw qe;
  if (!quiz) return null;
  if (!quiz.lesson_id) {
    return { courseId: null, moduleId: null, lessonId: null, quizId: quiz.id };
  }
  const { data: lesson, error: le } = await client
    .from("lessons")
    .select("id, module_id")
    .eq("id", quiz.lesson_id)
    .maybeSingle();
  if (le) throw le;
  if (!lesson) {
    return { courseId: null, moduleId: null, lessonId: null, quizId: quiz.id };
  }
  const { data: mod, error: me } = await client
    .from("modules")
    .select("id, course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();
  if (me) throw me;
  if (!mod) {
    return { courseId: null, moduleId: null, lessonId: lesson.id, quizId: quiz.id };
  }
  return {
    courseId: mod.course_id,
    moduleId: mod.id,
    lessonId: lesson.id,
    quizId: quiz.id,
  };
}

async function resolveLessonNav(client: SupabaseClient, lessonId: string): Promise<LessonNav | null> {
  const { data: lesson, error } = await client
    .from("lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!lesson) return null;
  const { data: mod, error: me } = await client
    .from("modules")
    .select("id, course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();
  if (me) throw me;
  if (!mod) return { courseId: null, moduleId: null, lessonId: lesson.id };
  return { courseId: mod.course_id, moduleId: mod.id, lessonId: lesson.id };
}

async function insertEventRow(
  client: SupabaseClient,
  payload: CreateLearningEventEnvelopeInput,
): Promise<ServiceResult<EmitEventResult>> {
  const built = createLearningEventEnvelope(payload);
  if (!built.success) {
    return {
      ok: false,
      error: err("EVENT_VALIDATION", "Invalid learning event metadata", built.error, built.error),
    };
  }
  const e = built.envelope;
  const { error } = await client.from("learning_events").insert({
    id: e.id,
    user_id: e.userId,
    event_type: e.eventType,
    event_version: e.eventVersion,
    course_id: e.courseId,
    module_id: e.moduleId,
    lesson_id: e.lessonId,
    quiz_id: e.quizId,
    attempt_id: e.attemptId,
    question_id: e.questionId,
    metadata: e.metadata as unknown as Record<string, unknown>,
    client_occurred_at: e.clientOccurredAt,
    created_at: e.createdAt,
    dedupe_key: e.dedupeKey,
  });
  if (error) return { ok: false, error: dbErr("Failed to insert learning_events", error) };
  return { ok: true, data: { eventId: e.id } };
}

type AttemptRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  submitted_at: string | null;
};

/** Shared guard: attempt exists, belongs to user, not submitted. */
async function requireOpenAttempt(
  client: SupabaseClient,
  userId: string,
  attemptId: string,
): Promise<ServiceResult<AttemptRow>> {
  const { data: attempt, error: attErr } = await client
    .from("quiz_attempts")
    .select("id, user_id, quiz_id, submitted_at")
    .eq("id", attemptId)
    .maybeSingle();
  if (attErr) return { ok: false, error: dbErr("Failed to load attempt", attErr) };
  if (!attempt) return { ok: false, error: err("NOT_FOUND", "Attempt not found") };
  if (attempt.user_id !== userId) return { ok: false, error: err("FORBIDDEN", "Attempt does not belong to user") };
  if (attempt.submitted_at) return { ok: false, error: err("CONFLICT", "Attempt already submitted") };
  return { ok: true, data: attempt };
}

async function fetchTopicLabels(
  client: SupabaseClient,
  topicId: string | null,
  subtopicId: string | null,
): Promise<{ topic: string; subtopic?: string }> {
  let topic = "unknown";
  if (topicId) {
    const { data } = await client.from("topics").select("label").eq("id", topicId).maybeSingle();
    if (data?.label) topic = data.label;
  }
  let subtopic: string | undefined;
  if (subtopicId) {
    const { data } = await client.from("subtopics").select("label").eq("id", subtopicId).maybeSingle();
    if (data?.label) subtopic = data.label;
  }
  return { topic, subtopic };
}

export function createLearningService(client: SupabaseClient): LearningService {
  return {
    async emitEvent(input: EmitEventInput): Promise<ServiceResult<EmitEventResult>> {
      try {
        return await insertEventRow(client, input);
      } catch (e) {
        return { ok: false, error: dbErr("emitEvent failed", e) };
      }
    },

    async startQuizAttempt(raw: StartQuizAttemptInput): Promise<ServiceResult<StartQuizAttemptResult>> {
      const parsed = z
        .object({ userId: uuidStr, quizId: uuidStr, mode: z.enum(["practice", "exam"]).optional() })
        .safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: err("VALIDATION", "Invalid startQuizAttempt input", parsed.error, parsed.error) };
      }
      const { userId, quizId, mode } = parsed.data;
      try {
        const nav = await resolveQuizNav(client, quizId);
        if (!nav) return { ok: false, error: err("NOT_FOUND", "Quiz not found") };

        const { data: attempt, error: ae } = await client
          .from("quiz_attempts")
          .insert({ user_id: userId, quiz_id: quizId })
          .select("id, started_at")
          .single();
        if (ae || !attempt) return { ok: false, error: dbErr("Failed to create quiz attempt", ae) };

        const meta = { quizId, ...(mode ? { mode } : {}) };
        const ev = await insertEventRow(client, {
          userId,
          eventType: "quiz_started",
          courseId: nav.courseId,
          moduleId: nav.moduleId,
          lessonId: nav.lessonId,
          quizId,
          attemptId: attempt.id,
          questionId: null,
          metadata: meta,
        });
        if (!ev.ok) return ev;

        return {
          ok: true,
          data: { attemptId: attempt.id, quizId, startedAt: attempt.started_at },
        };
      } catch (e) {
        return { ok: false, error: dbErr("startQuizAttempt failed", e) };
      }
    },

    async submitAnswer(raw: SubmitAnswerInput): Promise<ServiceResult<SubmitAnswerResult>> {
      const parsed = z
        .object({
          userId: uuidStr,
          attemptId: uuidStr,
          questionId: uuidStr,
          selectedOptionId: uuidStr.nullable(),
          responseTimeSeconds: z.number().nonnegative(),
        })
        .safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: err("VALIDATION", "Invalid submitAnswer input", parsed.error, parsed.error) };
      }
      const { userId, attemptId, questionId, selectedOptionId, responseTimeSeconds } = parsed.data;

      try {
        const open = await requireOpenAttempt(client, userId, attemptId);
        if (!open.ok) return open;
        const attempt = open.data;

        const { data: existing } = await client
          .from("quiz_attempt_answers")
          .select("id")
          .eq("attempt_id", attemptId)
          .eq("question_id", questionId)
          .maybeSingle();
        if (existing) return { ok: false, error: err("CONFLICT", "Question already answered for this attempt") };

        const { data: question, error: qErr } = await client
          .from("quiz_questions")
          .select("id, quiz_id, topic_id, subtopic_id, difficulty")
          .eq("id", questionId)
          .maybeSingle();
        if (qErr) return { ok: false, error: dbErr("Failed to load question", qErr) };
        if (!question || question.quiz_id !== attempt.quiz_id) {
          return { ok: false, error: err("NOT_FOUND", "Question not part of this quiz") };
        }

        const { data: options, error: oErr } = await client
          .from("question_options")
          .select("id, is_correct")
          .eq("question_id", questionId);
        if (oErr || !options?.length) return { ok: false, error: dbErr("Failed to load options", oErr) };

        const correct = isSelectedOptionCorrect(selectedOptionId, options);

        const { data: row, error: insErr } = await client
          .from("quiz_attempt_answers")
          .insert({
            attempt_id: attemptId,
            question_id: questionId,
            selected_option_id: selectedOptionId,
            is_correct: correct,
          })
          .select("id")
          .single();
        if (insErr || !row) return { ok: false, error: dbErr("Failed to save answer", insErr) };

        const nav = await resolveQuizNav(client, attempt.quiz_id);
        if (!nav) return { ok: false, error: err("NOT_FOUND", "Quiz context not found") };

        const labels = await fetchTopicLabels(client, question.topic_id, question.subtopic_id);
        const band = difficultyToBand(question.difficulty);

        const baseEvent = {
          userId,
          courseId: nav.courseId,
          moduleId: nav.moduleId,
          lessonId: nav.lessonId,
          quizId: attempt.quiz_id,
          attemptId,
          questionId,
        } satisfies Omit<CreateLearningEventEnvelopeInput, "eventType" | "metadata" | "eventVersion">;

        const qMeta = {
          questionId,
          topic: labels.topic,
          ...(labels.subtopic ? { subtopic: labels.subtopic } : {}),
          ...(band ? { difficulty: band } : {}),
          ...(selectedOptionId ? { selectedOptionId } : {}),
          isCorrect: correct,
          responseTimeSeconds,
        };

        const e1 = await insertEventRow(client, {
          ...baseEvent,
          eventType: "question_answered",
          metadata: qMeta,
        });
        if (!e1.ok) return e1;

        const followType = correct ? "answer_correct" : "answer_wrong";
        const followMeta = correct
          ? {
              questionId,
              topic: labels.topic,
              responseTimeSeconds,
            }
          : {
              questionId,
              topic: labels.topic,
              responseTimeSeconds,
            };

        const e2 = await insertEventRow(client, {
          ...baseEvent,
          eventType: followType,
          metadata: followMeta,
        });
        if (!e2.ok) return e2;

        return {
          ok: true,
          data: {
            answerId: row.id,
            attemptId,
            questionId,
            isCorrect: correct,
          },
        };
      } catch (e) {
        return { ok: false, error: dbErr("submitAnswer failed", e) };
      }
    },

    async submitQuiz(raw: SubmitQuizInput): Promise<ServiceResult<SubmitQuizResult>> {
      const parsed = z
        .object({
          userId: uuidStr,
          attemptId: uuidStr,
          timeSpentSeconds: z.number().nonnegative().optional(),
        })
        .safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: err("VALIDATION", "Invalid submitQuiz input", parsed.error, parsed.error) };
      }
      const { userId, attemptId, timeSpentSeconds } = parsed.data;

      try {
        const open = await requireOpenAttempt(client, userId, attemptId);
        if (!open.ok) return open;
        const attempt = open.data;

        const { data: questions, error: pq } = await client
          .from("quiz_questions")
          .select("id")
          .eq("quiz_id", attempt.quiz_id);
        if (pq) return { ok: false, error: dbErr("Failed to load questions", pq) };
        const totalCount = questions?.length ?? 0;
        if (totalCount === 0) return { ok: false, error: err("CONFLICT", "Quiz has no questions") };

        const { data: answers, error: pa } = await client
          .from("quiz_attempt_answers")
          .select("question_id, is_correct")
          .eq("attempt_id", attemptId);
        if (pa) return { ok: false, error: dbErr("Failed to load answers", pa) };

        const byQ = new Map((answers ?? []).map((a) => [a.question_id, a.is_correct]));
        let correctCount = 0;
        for (const q of questions ?? []) {
          if (byQ.get(q.id) === true) correctCount++;
        }

        const scorePct = scorePercentFromCounts(correctCount, totalCount);

        const { data: quizRow } = await client.from("quizzes").select("passing_score_pct").eq("id", attempt.quiz_id).single();
        const passing = quizRow?.passing_score_pct ?? 60;
        const passed = scorePct >= passing;

        const submittedAt = new Date().toISOString();
        const { error: upErr } = await client
          .from("quiz_attempts")
          .update({
            submitted_at: submittedAt,
            score_pct: scorePct,
            passed,
          })
          .eq("id", attemptId);
        if (upErr) return { ok: false, error: dbErr("Failed to finalize attempt", upErr) };

        const nav = await resolveQuizNav(client, attempt.quiz_id);
        if (!nav) return { ok: false, error: err("NOT_FOUND", "Quiz context not found") };

        const ev = await insertEventRow(client, {
          userId,
          eventType: "quiz_submitted",
          courseId: nav.courseId,
          moduleId: nav.moduleId,
          lessonId: nav.lessonId,
          quizId: attempt.quiz_id,
          attemptId,
          questionId: null,
          metadata: {
            quizId: attempt.quiz_id,
            attemptId,
            scorePercent: scorePct,
            correctCount,
            totalCount,
            ...(timeSpentSeconds !== undefined ? { timeSpentSeconds } : {}),
          },
        });
        if (!ev.ok) return ev;

        return {
          ok: true,
          data: {
            attemptId,
            quizId: attempt.quiz_id,
            scorePct,
            passed,
            correctCount,
            totalCount,
            submittedAt,
          },
        };
      } catch (e) {
        return { ok: false, error: dbErr("submitQuiz failed", e) };
      }
    },

    async markLessonStarted(raw: MarkLessonStartedInput): Promise<ServiceResult<LessonProgressSnapshot>> {
      const parsed = z
        .object({ userId: uuidStr, lessonId: uuidStr, source: z.string().optional() })
        .safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: err("VALIDATION", "Invalid markLessonStarted input", parsed.error, parsed.error) };
      }
      const { userId, lessonId, source } = parsed.data;
      try {
        const nav = await resolveLessonNav(client, lessonId);
        if (!nav) return { ok: false, error: err("NOT_FOUND", "Lesson not found") };

        const { data: existing } = await client
          .from("lesson_progress")
          .select("status")
          .eq("user_id", userId)
          .eq("lesson_id", lessonId)
          .maybeSingle();

        const nextStatus =
          existing?.status === "completed" ? "completed" : ("in_progress" as const);

        const { data: prog, error } = await client
          .from("lesson_progress")
          .upsert(
            {
              user_id: userId,
              lesson_id: lessonId,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,lesson_id" },
          )
          .select("lesson_id, status, completed_at, updated_at")
          .single();
        if (error || !prog) return { ok: false, error: dbErr("Failed to upsert lesson_progress", error) };

        const ev = await insertEventRow(client, {
          userId,
          eventType: "lesson_started",
          courseId: nav.courseId,
          moduleId: nav.moduleId,
          lessonId,
          quizId: null,
          attemptId: null,
          questionId: null,
          metadata: source ? { source } : {},
        });
        if (!ev.ok) return ev;

        return {
          ok: true,
          data: {
            lessonId: prog.lesson_id,
            status: prog.status as LessonProgressSnapshot["status"],
            completedAt: prog.completed_at,
            updatedAt: prog.updated_at,
          },
        };
      } catch (e) {
        return { ok: false, error: dbErr("markLessonStarted failed", e) };
      }
    },

    async markLessonCompleted(raw: MarkLessonCompletedInput): Promise<ServiceResult<LessonProgressSnapshot>> {
      const parsed = z
        .object({
          userId: uuidStr,
          lessonId: uuidStr,
          completionMethod: z.enum(["manual", "video", "quiz"]).optional(),
        })
        .safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: err("VALIDATION", "Invalid markLessonCompleted input", parsed.error, parsed.error) };
      }
      const { userId, lessonId, completionMethod } = parsed.data;
      try {
        const nav = await resolveLessonNav(client, lessonId);
        if (!nav) return { ok: false, error: err("NOT_FOUND", "Lesson not found") };

        if (nav.courseId) {
          const { data: enr } = await client
            .from("enrollments")
            .select("id")
            .eq("user_id", userId)
            .eq("course_id", nav.courseId)
            .maybeSingle();
          if (!enr) return { ok: false, error: err("FORBIDDEN", "Not enrolled in course for this lesson") };
        }

        const completedAt = new Date().toISOString();
        const { data: prog, error } = await client
          .from("lesson_progress")
          .upsert(
            {
              user_id: userId,
              lesson_id: lessonId,
              status: "completed",
              completed_at: completedAt,
              updated_at: completedAt,
            },
            { onConflict: "user_id,lesson_id" },
          )
          .select("lesson_id, status, completed_at, updated_at")
          .single();
        if (error || !prog) return { ok: false, error: dbErr("Failed to upsert lesson_progress", error) };

        const ev = await insertEventRow(client, {
          userId,
          eventType: "lesson_completed",
          courseId: nav.courseId,
          moduleId: nav.moduleId,
          lessonId,
          quizId: null,
          attemptId: null,
          questionId: null,
          metadata: completionMethod ? { completionMethod } : {},
        });
        if (!ev.ok) return ev;

        return {
          ok: true,
          data: {
            lessonId: prog.lesson_id,
            status: prog.status as LessonProgressSnapshot["status"],
            completedAt: prog.completed_at,
            updatedAt: prog.updated_at,
          },
        };
      } catch (e) {
        return { ok: false, error: dbErr("markLessonCompleted failed", e) };
      }
    },
  };
}
