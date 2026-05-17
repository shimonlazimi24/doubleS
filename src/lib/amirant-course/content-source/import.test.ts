import { describe, expect, it } from "vitest";
import { amirantContentSourceSchema } from "./schemas";
import { AMIRANT_PRODUCTION_CONTENT_SOURCE } from "./production-source";
import { importAmirantCourseContent } from "./import";

describe("amirant content ingestion schema", () => {
  it("parses current production source scaffold", () => {
    const parsed = amirantContentSourceSchema.parse(
      AMIRANT_PRODUCTION_CONTENT_SOURCE,
    );
    expect(parsed.meta.sourceKind).toBe("production");
  });

  it("rejects question without explanation", () => {
    const broken = structuredClone(AMIRANT_PRODUCTION_CONTENT_SOURCE);
    broken.questions.push({
      questionId: "q-1",
      topic: "vocabulary",
      subtopic: "vocab-core",
      difficultyLevel: 2,
      questionText: "x",
      options: [
        { id: "a", label: "a" },
        { id: "b", label: "b" },
        { id: "c", label: "c" },
        { id: "d", label: "d" },
      ],
      correctOptionId: "a",
      explanation: "",
      distractorExplanations: { b: "", c: "", d: "" },
      estimatedTimeSec: 50,
      tags: [],
    });
    expect(() => amirantContentSourceSchema.parse(broken)).toThrow();
  });

  it("builds imported bundle with normalized IDs", () => {
    const src = structuredClone(AMIRANT_PRODUCTION_CONTENT_SOURCE);
    src.lessons = [
      {
        moduleSlug: "introduction",
        lessonId: "Intro Exam Look",
        lessonTitle: "Intro lesson",
        lessonKind: "text",
        estimatedMinutes: 15,
        contentBlocks: [
          { type: "intro", title: "a", body: "b" },
          { type: "explanation", title: "a", body: "b" },
          { type: "examples", title: "a", items: ["b"] },
          { type: "summary", title: "a", bullets: ["b"] },
        ],
        transcriptOrAudioNotes: { transcriptText: "x", audioNotes: [] },
        aiRetrievalText: "x",
      },
    ];
    src.questions = Array.from({ length: 40 }, (_, i) => ({
      questionId: `Q ${i + 1}`,
      topic: "vocabulary" as const,
      subtopic: "vocab-core",
      difficultyLevel: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
      questionText: `Question ${i + 1}`,
      options: [
        { id: "a", label: "a" },
        { id: "b", label: "b" },
        { id: "c", label: "c" },
        { id: "d", label: "d" },
      ],
      correctOptionId: "a",
      explanation: "ok explanation",
      distractorExplanations: { b: "x", c: "x", d: "x" },
      estimatedTimeSec: 40,
      tags: [],
    }));
    src.practiceSets = [
      {
        practiceSetId: "PS 1",
        moduleSlug: "introduction",
        title: "set",
        topic: "vocabulary",
        subtopics: [],
        difficultyRange: { min: 1, max: 3 },
        numberOfQuestions: 1,
        timeLimitSec: 60,
      },
    ];
    src.simulationSections = [
      {
        simulationId: "sim-1",
        sectionId: "pilot",
        sectionType: "reading_comprehension",
        scoringMode: "pilot",
        questionCount: 1,
        timeLimitSec: 60,
        adaptiveRules: {
          adaptiveWithinSection: false,
          adaptiveBetweenSections: true,
          enterLevelSource: "prev",
          levelUpRule: "u",
          levelDownRule: "d",
          bounds: { min: 1, max: 6 },
        },
      },
      {
        simulationId: "sim-1",
        sectionId: "s1",
        sectionType: "vocabulary",
        scoringMode: "scored",
        questionCount: 1,
        timeLimitSec: 60,
        adaptiveRules: {
          adaptiveWithinSection: false,
          adaptiveBetweenSections: true,
          enterLevelSource: "prev",
          levelUpRule: "u",
          levelDownRule: "d",
          bounds: { min: 1, max: 6 },
        },
      },
    ];
    src.aiRetrieval = [
      {
        docId: "d1",
        lessonId: "Intro Exam Look",
        moduleSlug: "introduction",
        title: "t",
        body: "b",
        tags: [],
      },
    ];
    const imported = importAmirantCourseContent(src);
    expect(imported.lessonRegistry["intro-exam-look"]).toBeDefined();
    expect(imported.questionBank[0]?.id).toBe("q-1");
  });

  it("fails wave1 import under minimum question count", () => {
    const src = structuredClone(AMIRANT_PRODUCTION_CONTENT_SOURCE);
    src.questions = src.questions.slice(0, 39);
    expect(() => importAmirantCourseContent(src)).toThrow(/at least 40 questions/);
  });

  it("fails wave1 import if any difficulty bucket is missing", () => {
    const src = structuredClone(AMIRANT_PRODUCTION_CONTENT_SOURCE);
    src.questions = src.questions
      .filter((q) => q.difficultyLevel !== 6)
      .slice(0, 80);
    expect(() => importAmirantCourseContent(src)).toThrow(/missing difficulty levels/i);
  });
});
