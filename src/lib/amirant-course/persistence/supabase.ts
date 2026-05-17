import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdaptiveDecisionEvent,
  AdaptiveStateInput,
  AiInsightInput,
  AmirantPersistenceService,
  CrossTestStateInput,
  LearningEventInput,
  QuizAttemptStartInput,
  QuizAttemptSubmitInput,
  SimulationAttemptStartInput,
  SimulationAttemptSubmitInput,
  SimulationSectionSubmitInput,
  TopicRollupInput,
} from "./types";
import { clampDifficultyLevel } from "../difficulty-clamp";

async function getAuthedUserId(client: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

export async function createSupabasePersistenceService(
  client: SupabaseClient,
): Promise<AmirantPersistenceService | null> {
  const userId = await getAuthedUserId(client);
  if (!userId) return null;

  return {
    mode: "production",
    isRemote: true,
    hasUser: true,
    async startQuizAttempt(input: QuizAttemptStartInput) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("amirant_quiz_attempts")
        .insert({
          user_id: userId,
          quiz_id: input.quizId,
          source_mode: input.sourceMode,
          started_at: now,
          start_level: clampDifficultyLevel(input.startLevel),
          updated_at: now,
        })
        .select("id")
        .single();
      if (error || !data?.id) throw error ?? new Error("quiz attempt create failed");
      return data.id as string;
    },
    async submitQuizAttempt(input: QuizAttemptSubmitInput) {
      const now = new Date().toISOString();
      const { error: updateErr } = await client
        .from("amirant_quiz_attempts")
        .update({
          submitted_at: now,
          score_pct: input.scorePct,
          question_count: input.questionCount,
          correct_count: input.correctCount,
          start_level: clampDifficultyLevel(input.startLevel),
          end_level: clampDifficultyLevel(input.endLevel),
          updated_at: now,
        })
        .eq("id", input.attemptId)
        .eq("user_id", userId);
      if (updateErr) throw updateErr;

      if (input.answers.length > 0) {
        const rows = input.answers.map((a) => ({
          user_id: userId,
          attempt_id: input.attemptId,
          question_id: a.questionId,
          topic: a.topic,
          subtopic: a.subtopic ?? null,
          difficulty: clampDifficultyLevel(a.difficulty),
          selected_option_id: a.selectedOptionId,
          correct_option_id: a.correctOptionId,
          is_correct: a.isCorrect,
          response_time_ms: a.responseTimeMs ?? null,
          answered_at: now,
        }));
        const { error } = await client
          .from("amirant_quiz_answers")
          .upsert(rows, { onConflict: "attempt_id,question_id" });
        if (error) throw error;
      }
    },
    async startSimulationAttempt(input: SimulationAttemptStartInput) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from("amirant_simulation_attempts")
        .insert({
          user_id: userId,
          simulation_id: input.simulationId,
          source_mode: input.sourceMode,
          started_at: now,
          start_level: clampDifficultyLevel(input.startLevel),
          updated_at: now,
        })
        .select("id")
        .single();
      if (error || !data?.id) throw error ?? new Error("simulation attempt create failed");
      return data.id as string;
    },
    async submitSimulationSection(input: SimulationSectionSubmitInput) {
      const now = new Date().toISOString();
      const { error } = await client
        .from("amirant_simulation_sections")
        .upsert(
          {
            user_id: userId,
            attempt_id: input.attemptId,
            section_index: input.sectionIndex,
            section_kind: input.sectionKind,
            section_label: input.sectionLabel,
            topic: input.topic,
            enter_level: clampDifficultyLevel(input.enterLevel),
            question_count: input.questionCount,
            correct_count: input.correctCount,
            time_limit_sec: input.timeLimitSec,
            elapsed_sec: input.elapsedSec ?? null,
            answers: input.answers,
            submitted_at: now,
          },
          { onConflict: "attempt_id,section_index,section_kind" },
        );
      if (error) throw error;
    },
    async submitSimulationAttempt(input: SimulationAttemptSubmitInput) {
      const now = new Date().toISOString();
      const { error } = await client
        .from("amirant_simulation_attempts")
        .update({
          submitted_at: now,
          score_pct: input.scorePct,
          scored_question_count: input.scoredQuestionCount,
          scored_correct_count: input.scoredCorrectCount,
          start_level: clampDifficultyLevel(input.startLevel),
          end_level: clampDifficultyLevel(input.endLevel),
          updated_at: now,
        })
        .eq("id", input.attemptId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    async appendLearningEvent(input: LearningEventInput) {
      const { error } = await client.from("amirant_learning_events").insert({
        user_id: userId,
        event_type: input.eventType,
        lesson_id: input.lessonId ?? null,
        quiz_attempt_id: input.quizAttemptId ?? null,
        simulation_attempt_id: input.simulationAttemptId ?? null,
        metadata: input.metadata ?? {},
      });
      if (error) throw error;
    },
    async recordAdaptiveDecision(input: AdaptiveDecisionEvent) {
      const { error } = await client.from("amirant_learning_events").insert({
        user_id: userId,
        event_type: "adaptive_decision",
        metadata: input as unknown as Record<string, unknown>,
      });
      if (error) throw error;
    },
    async upsertTopicRollup(input: TopicRollupInput) {
      const { error } = await client.from("amirant_topic_rollups").upsert(
        {
          user_id: userId,
          topic: input.topic,
          total_answered: input.totalAnswered,
          total_correct: input.totalCorrect,
          avg_response_ms: input.avgResponseMs ?? null,
          by_difficulty: input.byDifficulty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic" },
      );
      if (error) throw error;
    },
    async upsertAdaptiveState(input: AdaptiveStateInput) {
      const { error } = await client.from("amirant_adaptive_state").upsert(
        {
          user_id: userId,
          topic: input.topic,
          current_level: clampDifficultyLevel(input.currentLevel),
          correct_streak: input.correctStreak,
          wrong_streak: input.wrongStreak,
          recent_accuracy: input.recentAccuracy ?? null,
          last_question_id: input.lastQuestionId ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic" },
      );
      if (error) throw error;
    },
    async upsertCrossTestState(input: CrossTestStateInput) {
      const { error } = await client.from("amirant_cross_test_state").upsert(
        {
          user_id: userId,
          last_end_level: clampDifficultyLevel(input.lastEndLevel),
          last_score_pct: Math.max(0, Math.min(100, Math.round(input.lastScorePct))),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    async saveAiInsight(input: AiInsightInput) {
      const { error } = await client.from("amirant_ai_insights").insert({
        user_id: userId,
        insight_kind: input.insightKind,
        model: input.model,
        prompt_version: input.promptVersion,
        input_refs: input.inputRefs,
        input_payload: input.inputPayload,
        output_payload: input.outputPayload,
      });
      if (error) throw error;
    },
  };
}
