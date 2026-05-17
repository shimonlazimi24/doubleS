import type { AmirantContentSourceInput } from "./schemas";
import lessonsJson from "../../../../content/amirant-import/source/lessons.json";
import questionsJson from "../../../../content/amirant-import/source/questions.json";
import practiceSetsJson from "../../../../content/amirant-import/source/practice-sets.json";
import simulationsJson from "../../../../content/amirant-import/source/simulations.json";
import aiRetrievalJson from "../../../../content/amirant-import/source/ai-retrieval.json";
import syllabusMappingJson from "../../../../content/amirant-import/source/syllabus-mapping.json";

/**
 * Production authoring source (to be filled by content team).
 * Imported from real AMIRNET markdown corpus.
 */
export const AMIRANT_PRODUCTION_CONTENT_SOURCE: AmirantContentSourceInput = {
  meta: {
    courseSlug: "amirant-preparation",
    sourceKind: "production",
    readiness: "production_ready",
    version: "v1",
  },
  lessons: lessonsJson as AmirantContentSourceInput["lessons"],
  questions: questionsJson as AmirantContentSourceInput["questions"],
  practiceSets: practiceSetsJson as AmirantContentSourceInput["practiceSets"],
  simulationSections:
    simulationsJson as AmirantContentSourceInput["simulationSections"],
  aiRetrieval: aiRetrievalJson as AmirantContentSourceInput["aiRetrieval"],
  syllabusMapping:
    ((syllabusMappingJson as { parts?: unknown[] }).parts ??
      []) as AmirantContentSourceInput["syllabusMapping"],
};
