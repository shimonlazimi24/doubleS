import {
  amirantContentSourceSchema,
  type AmirantContentSourceInput,
} from "./schemas";
import type { LessonContent } from "../types/content-blocks";
import type {
  CourseManifest,
  ManifestLesson,
  ManifestModule,
  ManifestPracticeSet,
  ManifestQuiz,
  ManifestSimulation,
} from "../types/course-manifest";
import type { BankQuestion } from "../types/bank-question";
import type { DifficultyLevel } from "@/lib/learning-intelligence/adaptive";
import {
  AMIRANT_PREPARATION_COURSE_ID,
  AMIRANT_PREPARATION_SLUG,
} from "../constants";

const MODULE_ORDER: Array<{ slug: ManifestModule["slug"]; title: string; sortOrder: number }> = [
  { slug: "introduction", title: "Introduction", sortOrder: 0 },
  { slug: "vocabulary", title: "Vocabulary", sortOrder: 1 },
  { slug: "sentence-completion", title: "Sentence Completion", sortOrder: 2 },
  { slug: "sentence-rephrasing", title: "Sentence Rephrasing", sortOrder: 3 },
  { slug: "reading-comprehension", title: "Reading Comprehension (Unseen)", sortOrder: 4 },
  { slug: "new-exam-format-2026", title: "New Exam Format (2026)", sortOrder: 5 },
  { slug: "full-simulations", title: "Full Simulations", sortOrder: 6 },
  { slug: "tips-strategies", title: "Tips & Strategies", sortOrder: 7 },
  { slug: "course-summary", title: "Course Summary", sortOrder: 8 },
];

const WAVE1_MIN_QUESTIONS = 40;
const REQUIRED_DIFFICULTIES: DifficultyLevel[] = [1, 2, 3, 4, 5, 6];

function normId(x: string): string {
  return x.trim().toLowerCase().replace(/\s+/g, "-");
}

function assertWave1ImportQuality(source: AmirantContentSourceInput): void {
  if (source.questions.length < WAVE1_MIN_QUESTIONS) {
    throw new Error(
      `Wave1 import failed: expected at least ${WAVE1_MIN_QUESTIONS} questions, got ${source.questions.length}.`,
    );
  }

  const missingExplanations = source.questions.filter(
    (q) => q.explanation.trim().length === 0,
  );
  if (missingExplanations.length > 0) {
    throw new Error(
      `Wave1 import failed: ${missingExplanations.length} questions are missing explanations.`,
    );
  }

  const existingDifficulties = new Set<number>(
    source.questions.map((q) => q.difficultyLevel),
  );
  const missingDifficulties = REQUIRED_DIFFICULTIES.filter(
    (d) => !existingDifficulties.has(d),
  );
  if (missingDifficulties.length > 0) {
    throw new Error(
      `Wave1 import failed: missing difficulty levels ${missingDifficulties.join(", ")}.`,
    );
  }
}

function buildPracticeQuestionIds(
  bank: BankQuestion[],
  topic: string,
  min: number,
  max: number,
  count: number,
): string[] {
  return bank
    .filter((q) => q.topicSlug === topic && q.difficulty >= min && q.difficulty <= max)
    .slice(0, count)
    .map((q) => q.id);
}

function buildSimulationBlueprints(
  sections: AmirantContentSourceInput["simulationSections"],
): ManifestSimulation[] {
  const byId = new Map<string, AmirantContentSourceInput["simulationSections"]>();
  for (const s of sections) {
    const list = byId.get(s.simulationId) ?? [];
    list.push(s);
    byId.set(s.simulationId, list);
  }
  const out: ManifestSimulation[] = [];
  for (const [simulationId, raw] of Array.from(byId.entries())) {
    const pilot = raw.find(
      (x: AmirantContentSourceInput["simulationSections"][number]) =>
        x.scoringMode === "pilot",
    );
    const scored = raw.filter(
      (x: AmirantContentSourceInput["simulationSections"][number]) =>
        x.scoringMode === "scored",
    );
    if (!pilot || scored.length === 0) continue;
    out.push({
      id: simulationId,
      title: simulationId,
      pilot: {
        seconds: pilot.timeLimitSec,
        questionCount: pilot.questionCount,
        topicSlug: pilot.sectionType,
      },
      sections: scored.map((x: AmirantContentSourceInput["simulationSections"][number]) => ({
        label: x.sectionId,
        seconds: x.timeLimitSec,
        topicSlug: x.sectionType,
        questionCount: x.questionCount,
      })),
    });
  }
  return out;
}

export interface ImportedAmirantCourseContent {
  sourceKind: "production" | "demo";
  readiness: "placeholder" | "production_ready";
  courseManifest: CourseManifest;
  lessonRegistry: Record<string, LessonContent>;
  questionBank: BankQuestion[];
  practiceSets: ManifestPracticeSet[];
  simulationBlueprints: ManifestSimulation[];
  aiRetrievalCorpus: Array<{
    docId: string;
    lessonId: string;
    moduleSlug: string;
    title: string;
    body: string;
    tags: string[];
  }>;
  syllabusMapping: AmirantContentSourceInput["syllabusMapping"];
}

/**
 * Import + validate source content package.
 * This function is the single ingestion entrypoint used by runtime and tooling.
 */
export function importAmirantCourseContent(
  source: AmirantContentSourceInput,
): ImportedAmirantCourseContent {
  const parsed = amirantContentSourceSchema.parse(source);
  assertWave1ImportQuality(parsed);

  const lessonRegistry: Record<string, LessonContent> = {};
  for (const l of parsed.lessons) {
    const lessonId = normId(l.lessonId);
    lessonRegistry[lessonId] = {
      lessonId,
      blocks: l.contentBlocks,
    };
  }

  const questionBank: BankQuestion[] = parsed.questions.map((q) => ({
    id: normId(q.questionId),
    prompt: q.questionText,
    options: q.options.map((o) => ({ id: o.id, label: o.label })),
    correctOptionId: q.correctOptionId,
    explanation: q.explanation,
    topicSlug: q.topic,
    subtopicSlug: q.subtopic,
    difficulty: q.difficultyLevel as DifficultyLevel,
  }));

  const practiceSets: ManifestPracticeSet[] = parsed.practiceSets.map((p) => ({
    id: normId(p.practiceSetId),
    title: p.title,
    questionIds: buildPracticeQuestionIds(
      questionBank,
      p.topic,
      p.difficultyRange.min,
      p.difficultyRange.max,
      p.numberOfQuestions,
    ),
  }));

  const lessonsByModule = new Map<string, ManifestLesson[]>();
  for (const l of parsed.lessons) {
    const list = lessonsByModule.get(l.moduleSlug) ?? [];
    list.push({
      id: normId(l.lessonId),
      title: l.lessonTitle,
      kind: l.lessonKind,
      estimatedMinutes: l.estimatedMinutes,
    });
    lessonsByModule.set(l.moduleSlug, list);
  }
  const practicesByModule = new Map<string, ManifestPracticeSet[]>();
  for (const p of parsed.practiceSets) {
    const list = practicesByModule.get(p.moduleSlug) ?? [];
    const row = practiceSets.find((x) => x.id === normId(p.practiceSetId));
    if (row) list.push(row);
    practicesByModule.set(p.moduleSlug, list);
  }

  const modules: ManifestModule[] = MODULE_ORDER.map((m) => {
    const lessons = lessonsByModule.get(m.slug) ?? [];
    const practice = practicesByModule.get(m.slug) ?? [];
    const quizzes: ManifestQuiz[] =
      lessons.length > 0
        ? [
            {
              id: `quiz-${m.slug}`,
              title: `${m.title} adaptive`,
              adaptive: true,
              questionCount: 16,
              timeLimitSec: 39 * 60,
              topicSlugs: Array.from(new Set(practice.map((p) => {
                const q = p.questionIds[0];
                const row = questionBank.find((x) => x.id === q);
                return row?.topicSlug ?? "reading_comprehension";
              }))),
            },
          ]
        : [];
    return {
      id: `mod-${m.slug}`,
      slug: m.slug,
      title: m.title,
      sortOrder: m.sortOrder,
      lessons,
      practiceSets: practice,
      quizzes,
    };
  });

  const simulationBlueprints = buildSimulationBlueprints(parsed.simulationSections);

  const courseManifest: CourseManifest = {
    id: AMIRANT_PREPARATION_COURSE_ID,
    slug: AMIRANT_PREPARATION_SLUG,
    title: "Amirant Preparation",
    description:
      "Imported production content package for Amirant course.",
    modules,
    simulations: simulationBlueprints,
  };

  return {
    sourceKind: parsed.meta.sourceKind,
    readiness: parsed.meta.readiness,
    courseManifest,
    lessonRegistry,
    questionBank,
    practiceSets,
    simulationBlueprints,
    aiRetrievalCorpus: parsed.aiRetrieval.map((x) => ({
      docId: x.docId,
      lessonId: normId(x.lessonId),
      moduleSlug: x.moduleSlug,
      title: x.title,
      body: x.body,
      tags: x.tags,
    })),
    syllabusMapping: parsed.syllabusMapping,
  };
}
