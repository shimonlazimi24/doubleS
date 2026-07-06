import { z } from "zod";

const topicSchema = z.enum([
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
]);

const moduleSlugSchema = z.enum([
  "introduction",
  "vocabulary",
  "sentence-completion",
  "sentence-rephrasing",
  "reading-comprehension",
  "new-exam-format-2026",
  "full-simulations",
  "tips-strategies",
  "course-summary",
]);

const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("intro"),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  z.object({
    type: z.literal("explanation"),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  z.object({
    type: z.literal("examples"),
    title: z.string().min(1),
    items: z.array(z.string().min(1)).default([]),
  }),
  z.object({
    type: z.literal("summary"),
    title: z.string().min(1),
    bullets: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("callout"),
    variant: z.enum(["tip", "warning", "info"]),
    body: z.string().min(1),
  }),
]);

export const lessonSourceItemSchema = z.object({
  moduleSlug: moduleSlugSchema,
  lessonId: z.string().min(1),
  lessonTitle: z.string().min(1),
  lessonKind: z.enum(["video", "text", "mixed"]),
  estimatedMinutes: z.number().int().positive(),
  contentBlocks: z.array(contentBlockSchema).min(4),
  transcriptOrAudioNotes: z
    .object({
      transcriptText: z.string().optional().default(""),
      audioNotes: z.array(z.string()).optional().default([]),
    })
    .default({ transcriptText: "", audioNotes: [] }),
  aiRetrievalText: z.string().min(1),
});

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const questionSourceItemSchema = z
  .object({
    questionId: z.string().min(1),
    topic: topicSchema,
    subtopic: z.string().min(1),
    difficultyLevel: z.number().int().min(1).max(6),
    questionText: z.string().min(1),
    options: z.array(optionSchema).length(4),
    correctOptionId: z.string().min(1),
    explanation: z.string().min(1),
    distractorExplanations: z.record(z.string(), z.string()).default({}),
    estimatedTimeSec: z.number().int().positive(),
    tags: z.array(z.string().min(1)).default([]),
    /** קטע קריאה משותף (הבנת הנקרא) — הפניה ל־passages. */
    passageId: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    const ids = new Set(val.options.map((o) => o.id));
    if (!ids.has(val.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctOptionId must match one option id",
        path: ["correctOptionId"],
      });
    }
  });

export const practiceSetSourceItemSchema = z.object({
  practiceSetId: z.string().min(1),
  moduleSlug: moduleSlugSchema,
  title: z.string().min(1),
  topic: topicSchema,
  subtopics: z.array(z.string().min(1)).default([]),
  difficultyRange: z.object({
    min: z.number().int().min(1).max(6),
    max: z.number().int().min(1).max(6),
  }),
  numberOfQuestions: z.number().int().positive(),
  timeLimitSec: z.number().int().positive(),
});

export const simulationSectionSourceItemSchema = z.object({
  simulationId: z.string().min(1),
  sectionId: z.string().min(1),
  sectionType: topicSchema,
  scoringMode: z.enum(["scored", "pilot"]),
  questionCount: z.number().int().positive(),
  timeLimitSec: z.number().int().positive(),
  adaptiveRules: z.object({
    adaptiveWithinSection: z.boolean(),
    adaptiveBetweenSections: z.boolean(),
    enterLevelSource: z.string().min(1),
    levelUpRule: z.string().min(1),
    levelDownRule: z.string().min(1),
    bounds: z.object({
      min: z.number().int().min(1).max(6),
      max: z.number().int().min(1).max(6),
    }),
  }),
});

export const aiRetrievalItemSchema = z.object({
  docId: z.string().min(1),
  lessonId: z.string().min(1),
  moduleSlug: moduleSlugSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
});

export const syllabusMappingItemSchema = z.object({
  syllabusBulletId: z.string().min(1),
  artifactType: z.enum([
    "lesson",
    "question_bank_batch",
    "practice_set",
    "simulation_section",
    "ai_retrieval",
  ]),
  moduleSlug: moduleSlugSchema,
});

export const syllabusMappingPartSchema = z.object({
  partId: z.string().min(1),
  partTitle: z.string().min(1),
  items: z.array(syllabusMappingItemSchema),
});

/** קטע קריאה (הבנת הנקרא) — משותף לכמה שאלות דרך passageId. */
export const passageSourceItemSchema = z.object({
  passageId: z.string().min(1),
  title: z.string().default(""),
  bodyMarkdown: z.string().min(1),
  sourceTag: z.string().default(""),
});

export const amirantContentSourceSchema = z.object({
  meta: z.object({
    courseSlug: z.literal("amirant-preparation"),
    sourceKind: z.enum(["production", "demo"]),
    readiness: z.enum(["placeholder", "production_ready"]),
    version: z.string().min(1),
  }),
  lessons: z.array(lessonSourceItemSchema),
  questions: z.array(questionSourceItemSchema),
  practiceSets: z.array(practiceSetSourceItemSchema),
  simulationSections: z.array(simulationSectionSourceItemSchema),
  aiRetrieval: z.array(aiRetrievalItemSchema),
  syllabusMapping: z.array(syllabusMappingPartSchema).default([]),
  /** אופציונלי — חבילות ישנות עדיין תקפות. */
  passages: z.array(passageSourceItemSchema).default([]),
});

export type AmirantContentSourceInput = z.infer<typeof amirantContentSourceSchema>;
