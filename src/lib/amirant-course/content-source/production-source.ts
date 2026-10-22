import type { AmirantContentSourceInput } from "./schemas";
import { AMIRANT_QUESTION_SOURCE } from "./question-source";
import lessonsJson from "../../../../content/amirant-import/source/lessons.json";
import practiceSetsJson from "../../../../content/amirant-import/source/practice-sets.json";
import simulationsJson from "../../../../content/amirant-import/source/simulations.json";
import aiRetrievalJson from "../../../../content/amirant-import/source/ai-retrieval.json";
import syllabusMappingJson from "../../../../content/amirant-import/source/syllabus-mapping.json";

/**
 * The full authoring package, imported from the AMIRNET markdown corpus.
 *
 * **Build-time and tests only.** Besides the question bank this pulls in
 * `lessons.json` (1.4MB) and `ai-retrieval.json` (0.4MB), which no request
 * ever needs: the lesson bodies come from the markdown registry and the
 * manifest is generated once by `scripts/generate-course-manifest.mjs`.
 * Runtime code reads `question-source.ts` through `resolved-content.ts`.
 */
export const AMIRANT_PRODUCTION_CONTENT_SOURCE: AmirantContentSourceInput = {
  meta: {
    courseSlug: "amirant-preparation",
    sourceKind: "production",
    readiness: "production_ready",
    version: "v1",
  },
  lessons: lessonsJson as AmirantContentSourceInput["lessons"],
  questions: AMIRANT_QUESTION_SOURCE.questions,
  practiceSets: practiceSetsJson as AmirantContentSourceInput["practiceSets"],
  simulationSections:
    simulationsJson as AmirantContentSourceInput["simulationSections"],
  aiRetrieval: aiRetrievalJson as AmirantContentSourceInput["aiRetrieval"],
  syllabusMapping:
    ((syllabusMappingJson as { parts?: unknown[] }).parts ??
      []) as AmirantContentSourceInput["syllabusMapping"],
  passages: AMIRANT_QUESTION_SOURCE.passages,
};
