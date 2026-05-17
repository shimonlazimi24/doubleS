import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { z } from "zod";

const ROOT = process.cwd();
const QUESTIONS_PATH = path.join(
  ROOT,
  "content",
  "amirant-import",
  "source",
  "questions.json",
);
const LESSONS_PATH = path.join(ROOT, "content", "amirant-import", "source", "lessons.json");
const PRACTICE_PATH = path.join(ROOT, "content", "amirant-import", "source", "practice-sets.json");
const SIMULATIONS_PATH = path.join(ROOT, "content", "amirant-import", "source", "simulations.json");
const AI_RETRIEVAL_PATH = path.join(ROOT, "content", "amirant-import", "source", "ai-retrieval.json");
const SYLLABUS_MAPPING_PATH = path.join(ROOT, "content", "amirant-import", "source", "syllabus-mapping.json");
const COVERAGE_JSON_PATH = path.join(ROOT, "reports", "amirant-coverage.json");

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
  z.object({ type: z.literal("intro"), title: z.string().min(1), body: z.string().min(1) }),
  z.object({ type: z.literal("explanation"), title: z.string().min(1), body: z.string().min(1) }),
  z.object({ type: z.literal("examples"), title: z.string().min(1), items: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal("summary"), title: z.string().min(1), bullets: z.array(z.string().min(1)).min(1) }),
]);

const lessonsSchema = z.array(
  z.object({
    moduleSlug: moduleSlugSchema,
    lessonId: z.string().min(1),
    lessonTitle: z.string().min(1),
    lessonKind: z.enum(["text", "video", "mixed"]),
    estimatedMinutes: z.number().int().positive(),
    contentBlocks: z.array(contentBlockSchema).min(1),
    transcriptOrAudioNotes: z.object({
      transcriptText: z.string(),
      audioNotes: z.array(z.string()),
    }),
    aiRetrievalText: z.string().min(1),
  }),
);

const optionSchema = z.object({
  id: z.enum(["a", "b", "c", "d"]),
  label: z.string().trim().min(1),
});

const questionSchema = z
  .object({
    questionId: z.string().min(1),
    topic: z.enum([
      "vocabulary",
      "sentence_completion",
      "rephrasing",
      "reading_comprehension",
    ]),
    subtopic: z.string().trim().min(1),
    difficultyLevel: z.number().int().min(1).max(6),
    questionText: z.string().trim().min(1),
    options: z.array(optionSchema).length(4),
    correctOptionId: z.enum(["a", "b", "c", "d"]),
    explanation: z.string().trim().min(1),
    distractorExplanations: z.record(z.string(), z.string()).default({}),
    estimatedTimeSec: z.number().int().positive(),
    tags: z.array(z.string()).default([]),
  })
  .superRefine((value, ctx) => {
    const optionIds = new Set(value.options.map((option) => option.id));
    if (!optionIds.has(value.correctOptionId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctOptionId must exist in options",
      });
    }
  });

const questionsSchema = z.array(questionSchema);

const practiceSetsSchema = z.array(
  z.object({
    practiceSetId: z.string().min(1),
    moduleSlug: moduleSlugSchema,
    title: z.string().min(1),
    topic: z.enum([
      "vocabulary",
      "sentence_completion",
      "rephrasing",
      "reading_comprehension",
    ]),
    subtopics: z.array(z.string().min(1)).default([]),
    difficultyRange: z.object({
      min: z.number().int().min(1).max(6),
      max: z.number().int().min(1).max(6),
    }),
    numberOfQuestions: z.number().int().positive(),
    timeLimitSec: z.number().int().positive(),
  }),
);

const simulationsSchema = z.array(
  z.object({
    simulationId: z.string().min(1),
    sectionId: z.string().min(1),
    sectionType: z.enum([
      "vocabulary",
      "sentence_completion",
      "rephrasing",
      "reading_comprehension",
    ]),
    scoringMode: z.enum(["pilot", "scored"]),
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
  }),
);

const aiRetrievalSchema = z.array(
  z.object({
    docId: z.string().min(1),
    lessonId: z.string().min(1),
    moduleSlug: moduleSlugSchema,
    title: z.string().min(1),
    body: z.string().min(1),
    tags: z.array(z.string()).default([]),
  }),
);

const syllabusMappingSchema = z.object({
  courseSlug: z.string().min(1),
  mappingVersion: z.string().min(1),
  parts: z.array(
    z.object({
      partId: z.string().min(1),
      partTitle: z.string().min(1),
      items: z.array(
        z.object({
          syllabusBulletId: z.string().min(1),
          moduleSlug: moduleSlugSchema,
          artifactType: z.enum([
            "lesson",
            "question_bank_batch",
            "practice_set",
            "simulation",
            "simulation_section",
            "guideline",
          ]),
        }),
      ),
    }),
  ),
});

function run(command, args, capture = false) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    stdio: capture ? "pipe" : "inherit",
    encoding: capture ? "utf8" : undefined,
    shell: false,
  });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
  return res;
}

function assertWave1RulesFromSource() {
  const lessons = lessonsSchema.parse(
    JSON.parse(fs.readFileSync(LESSONS_PATH, "utf8")),
  );
  const questions = questionsSchema.parse(
    JSON.parse(fs.readFileSync(QUESTIONS_PATH, "utf8")),
  );
  const practiceSets = practiceSetsSchema.parse(
    JSON.parse(fs.readFileSync(PRACTICE_PATH, "utf8")),
  );
  const simulations = simulationsSchema.parse(
    JSON.parse(fs.readFileSync(SIMULATIONS_PATH, "utf8")),
  );
  aiRetrievalSchema.parse(JSON.parse(fs.readFileSync(AI_RETRIEVAL_PATH, "utf8")));
  syllabusMappingSchema.parse(
    JSON.parse(fs.readFileSync(SYLLABUS_MAPPING_PATH, "utf8")),
  );

  if (lessons.length === 0) {
    throw new Error("Wave1 ingest failed: no lessons found.");
  }
  if (practiceSets.length === 0) {
    throw new Error("Wave1 ingest failed: no practice sets found.");
  }
  if (simulations.length === 0) {
    throw new Error("Wave1 ingest failed: no simulations found.");
  }

  if (questions.length < 40) {
    throw new Error(`Wave1 ingest failed: requires at least 40 questions, got ${questions.length}`);
  }

  const missingExplanations = questions.filter(
    (q) => String(q.explanation ?? "").trim().length === 0,
  );
  if (missingExplanations.length > 0) {
    throw new Error(`Wave1 ingest failed: ${missingExplanations.length} questions have missing explanations`);
  }

  const existingDifficulties = new Set(
    questions.map((q) => Number(q.difficultyLevel)),
  );
  const missingDifficulty = [1, 2, 3, 4, 5, 6].filter(
    (d) => !existingDifficulties.has(d),
  );
  if (missingDifficulty.length > 0) {
    throw new Error(
      `Wave1 ingest failed: missing difficulty levels ${missingDifficulty.join(", ")}`,
    );
  }
}

function main() {
  assertWave1RulesFromSource();
  const coverage = run("node", ["scripts/amirant-content-coverage.mjs"], true);

  if (!fs.existsSync(path.join(ROOT, "reports"))) {
    fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  }
  fs.writeFileSync(COVERAGE_JSON_PATH, String(coverage.stdout ?? "").trim() + "\n");
  run("node", ["scripts/amirant-coverage-to-csv.mjs"]);
}

main();
