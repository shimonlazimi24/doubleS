import { z } from "zod";

export const aiRefSchema = z.object({
  chunkId: z.string().min(1),
  lessonId: z.string().optional(),
  topic: z.string().optional(),
});

// Strict variant for OpenAI structured output - no .optional(), only .nullable()
export const aiRefSchemaStrict = z.object({
  chunkId: z.string().min(1),
  lessonId: z.string().nullable().default(null),
  topic: z.string().nullable().default(null),
});

/** תור אחד בהיסטוריית השיחה - נשלח מהפאנל כדי שהעוזר יזכור את ההקשר. */
export const chatHistoryTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(600),
});

export const lessonChatRequestSchema = z.object({
  /** אופציונלי - בלי `lessonId` מחפשים הקשר לרוחב כל קורס ההכנה (RAG). */
  lessonId: z.string().min(1).optional(),
  topic: z.string().optional(),
  userMessage: z.string().min(1).max(1500),
  /** Plain-text content of the step/question currently visible on screen - injected by the client. */
  activeQuestionText: z.string().max(800).optional(),
  /** התורות האחרונים בשיחה (עד 8) - בלעדיהם שאלות המשך נענות בלי הקשר. */
  history: z.array(chatHistoryTurnSchema).max(8).optional(),
});

export const amirantChatIntentValues = [
  "question_help",
  "staged_hint",
  "reveal_answer",
  "logistics",
  "performance_analysis",
  "recommendation",
  "vocabulary_lookup",
  "general_course_help",
] as const;

export const lessonChatResponseSchema = z.object({
  intent: z.enum(amirantChatIntentValues),
  answer: z.string().min(1),
  questionType: z
    .enum([
      "sentence_completion",
      "rephrasing",
      "reading_comprehension",
      "vocabulary",
      "simulation",
      "general_lesson",
      "unknown",
    ])
    .optional()
    .nullable(),
  hintStage: z.number().int().min(1).max(4).nullable().optional(),
  nextHintAvailable: z.boolean().optional().default(false),
  recommendedAction: z.string().nullable().optional(),
  referencedChunks: z.array(aiRefSchema).default([]),
  references: z.array(aiRefSchema).default([]),
  usedStudentData: z.boolean().optional().default(false),
  safeFallback: z.boolean().default(false),
});

export const quizReviewRequestSchema = z.object({
  quizAttemptId: z.string().uuid(),
  wrongQuestionIds: z.array(z.string()).default([]),
  weakTopics: z.array(z.string()).default([]),
});

export const quizReviewResponseSchema = z.object({
  summary: z.string().min(1),
  actionItems: z.array(z.string()).default([]),
  references: z.array(aiRefSchema).default([]),
  safeFallback: z.boolean().default(false),
}); // all fields required or have defaults - OK for structured output

export const recommendationsRequestSchema = z.object({
  weakTopics: z.array(z.string()).default([]),
  strongTopics: z.array(z.string()).default([]),
  byTopic: z.record(
    z.string(),
    z.object({
      correct: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
      byDifficulty: z.record(z.string(), z.object({ correct: z.number(), total: z.number() })).default({}),
      responseTimeMsSum: z.number().optional(),
      responseTimeSamples: z.number().optional(),
    }),
  ),
  sessionsSample: z
    .array(
      z.object({
        at: z.string(),
        kind: z.enum(["quiz", "simulation", "practice"]),
        label: z.string(),
        scorePct: z.number().optional(),
      }),
    )
    .default([]),
  improvementHint: z.string().default(""),
});

export const recommendationsResponseSchema = z.object({
  priorities: z.array(z.string()).default([]),
  weeklyPlan: z.array(z.string()).default([]),
  why: z.string().default(""),
  references: z.array(aiRefSchema).default([]),
  safeFallback: z.boolean().default(false),
});

export const coachSummaryRequestSchema = z.object({
  weakTopics: z.array(z.string()).default([]),
  strongTopics: z.array(z.string()).default([]),
  latestScorePct: z.number().min(0).max(100).optional(),
  sessionsCount: z.number().int().nonnegative().default(0),
});

export const coachSummaryResponseSchema = z.object({
  coachSummary: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]).default("low"),
  references: z.array(aiRefSchema).default([]),
  safeFallback: z.boolean().default(false),
});

export type LessonChatRequest = z.infer<typeof lessonChatRequestSchema>;
export type LessonChatResponse = z.infer<typeof lessonChatResponseSchema>;
export type QuizReviewRequest = z.infer<typeof quizReviewRequestSchema>;
export type QuizReviewResponse = z.infer<typeof quizReviewResponseSchema>;
export type RecommendationsRequest = z.infer<typeof recommendationsRequestSchema>;
export type RecommendationsResponse = z.infer<typeof recommendationsResponseSchema>;
export type CoachSummaryRequest = z.infer<typeof coachSummaryRequestSchema>;
export type CoachSummaryResponse = z.infer<typeof coachSummaryResponseSchema>;
