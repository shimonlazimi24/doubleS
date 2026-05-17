import type { ImportedAmirantCourseContent } from "./import";
import { AMIRANT_COURSE_SYLLABUS_PARTS } from "@/lib/prep/amirant-course-syllabus";

export type CoverageStatus = "implemented" | "placeholder" | "missing";

export interface CoverageRow {
  syllabusSectionId: string;
  syllabusSectionTitle: string;
  mappedModuleSlug: string;
  artifactType:
    | "lesson"
    | "question_bank_batch"
    | "practice_set"
    | "simulation_section"
    | "ai_retrieval";
  status: CoverageStatus;
}

export interface CoverageReport {
  rows: CoverageRow[];
  questionsByTopic: Record<string, number>;
  questionsBySubtopic: Record<string, number>;
  questionsByDifficulty: Record<number, number>;
  minimumRequired: {
    totalQuestions: number;
    minPerTopic: number;
    minPerDifficulty: number;
  };
  gapCount: {
    totalQuestions: number;
    byTopic: Record<string, number>;
    byDifficulty: Record<number, number>;
  };
}

export function buildAmirantCoverageMatrix(params: {
  imported: ImportedAmirantCourseContent;
  minimumRequired?: {
    totalQuestions?: number;
    minPerTopic?: number;
    minPerDifficulty?: number;
  };
}): CoverageReport {
  const min = {
    totalQuestions: params.minimumRequired?.totalQuestions ?? 400,
    minPerTopic: params.minimumRequired?.minPerTopic ?? 80,
    minPerDifficulty: params.minimumRequired?.minPerDifficulty ?? 50,
  };
  const questionsByTopic: Record<string, number> = {};
  const questionsBySubtopic: Record<string, number> = {};
  const questionsByDifficulty: Record<number, number> = {};
  for (const q of params.imported.questionBank) {
    questionsByTopic[q.topicSlug] = (questionsByTopic[q.topicSlug] ?? 0) + 1;
    questionsBySubtopic[q.subtopicSlug] =
      (questionsBySubtopic[q.subtopicSlug] ?? 0) + 1;
    questionsByDifficulty[q.difficulty] =
      (questionsByDifficulty[q.difficulty] ?? 0) + 1;
  }

  const rows: CoverageRow[] = [];
  const mappingIndex = new Map<
    string,
    {
      moduleSlug: string;
      artifactType:
        | "lesson"
        | "question_bank_batch"
        | "practice_set"
        | "simulation_section"
        | "ai_retrieval";
    }
  >();
  for (const part of params.imported.syllabusMapping) {
    for (const item of part.items) {
      mappingIndex.set(item.syllabusBulletId, {
        moduleSlug: item.moduleSlug,
        artifactType: item.artifactType,
      });
    }
  }

  const syllabusLeaves: Array<{ id: string; title: string }> = [];
  for (const part of AMIRANT_COURSE_SYLLABUS_PARTS) {
    for (const bullet of part.bullets) {
      if (bullet.children?.length) {
        for (const c of bullet.children) {
          syllabusLeaves.push({ id: c.id, title: c.title });
        }
      } else {
        syllabusLeaves.push({ id: bullet.id, title: bullet.title });
      }
    }
  }

  for (const leaf of syllabusLeaves) {
    const mapped = mappingIndex.get(leaf.id);
    if (!mapped) {
      rows.push({
        syllabusSectionId: leaf.id,
        syllabusSectionTitle: leaf.title,
        mappedModuleSlug: "unmapped",
        artifactType: "lesson",
        status: "missing",
      });
      continue;
    }
    {
      const item = mapped;
      let status: CoverageStatus = "missing";
      if (item.artifactType === "lesson") {
        const courseModule = params.imported.courseManifest.modules.find(
          (m) => m.slug === item.moduleSlug,
        );
        status =
          courseModule && courseModule.lessons.length > 0
            ? "implemented"
            : "missing";
      } else if (item.artifactType === "question_bank_batch") {
        status = Object.keys(questionsByTopic).length > 0 ? "implemented" : "missing";
      } else if (item.artifactType === "practice_set") {
        status = params.imported.practiceSets.length > 0 ? "implemented" : "missing";
      } else if (item.artifactType === "simulation_section") {
        status =
          params.imported.simulationBlueprints.length > 0
            ? "implemented"
            : "missing";
      } else if (item.artifactType === "ai_retrieval") {
        status = params.imported.aiRetrievalCorpus.length > 0 ? "implemented" : "missing";
      }
      if (params.imported.readiness === "placeholder" && status === "implemented") {
        status = "placeholder";
      }
      rows.push({
        syllabusSectionId: leaf.id,
        syllabusSectionTitle: leaf.title,
        mappedModuleSlug: item.moduleSlug,
        artifactType: item.artifactType,
        status,
      });
    }
  }

  const topicKeys = [
    "vocabulary",
    "sentence_completion",
    "rephrasing",
    "reading_comprehension",
  ];
  const difficultyKeys = [1, 2, 3, 4, 5, 6];

  const gapByTopic: Record<string, number> = {};
  for (const t of topicKeys) {
    gapByTopic[t] = Math.max(0, min.minPerTopic - (questionsByTopic[t] ?? 0));
  }
  const gapByDifficulty: Record<number, number> = {};
  for (const d of difficultyKeys) {
    gapByDifficulty[d] = Math.max(
      0,
      min.minPerDifficulty - (questionsByDifficulty[d] ?? 0),
    );
  }

  return {
    rows,
    questionsByTopic,
    questionsBySubtopic,
    questionsByDifficulty,
    minimumRequired: min,
    gapCount: {
      totalQuestions: Math.max(
        0,
        min.totalQuestions - params.imported.questionBank.length,
      ),
      byTopic: gapByTopic,
      byDifficulty: gapByDifficulty,
    },
  };
}

