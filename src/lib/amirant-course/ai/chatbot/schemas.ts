import { z } from "zod";
import { lessonChatRequestSchema, lessonChatResponseSchema, aiRefSchemaStrict, amirantChatIntentValues } from "../schemas";

export { amirantChatIntentValues };
export const QUESTION_TYPE_VALUES = [
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
  "vocabulary",
  "simulation",
  "general_lesson",
] as const;
export type AmirantQuestionType = (typeof QUESTION_TYPE_VALUES)[number];

export type AmirantChatIntent = (typeof amirantChatIntentValues)[number];

export const clientActionValues = [
  "auto",
  "hint",
  "next_hint",
  "reveal",
  "vocab_lookup",
  "performance",
  "recommend",
] as const;
export type AmirantClientAction = (typeof clientActionValues)[number];

export const amirantChatbotRequestSchema = lessonChatRequestSchema.extend({
  clientAction: z.enum(clientActionValues).optional().default("auto"),
  stagedHintContext: z
    .object({
      stage: z.number().int().min(1).max(4).optional(),
      questionType: z.string().optional(),
    })
    .optional(),
  vocabularyWord: z.string().max(80).optional(),
});

export type AmirantChatbotRequest = z.infer<typeof amirantChatbotRequestSchema>;

export const amirantChatbotResponseSchema = lessonChatResponseSchema;

export type AmirantChatbotResponse = z.infer<typeof amirantChatbotResponseSchema>;

// OpenAI structured output requires all fields required or .nullable() — no bare .optional()
export const amirantChatbotAiResponseSchema = z.object({
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
    .nullable()
    .default("unknown"),
  hintStage: z.number().int().min(1).max(4).nullable().default(null),
  nextHintAvailable: z.boolean().default(false),
  recommendedAction: z.string().nullable().default(null),
  usedStudentData: z.boolean().default(false),
  safeFallback: z.boolean().default(false),
  references: z.array(aiRefSchemaStrict).default([]),
});
export type AmirantChatbotAiResponse = z.infer<typeof amirantChatbotAiResponseSchema>;
