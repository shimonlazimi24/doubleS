import { importAmirantCourseContent } from "./import";
import { AMIRANT_PRODUCTION_CONTENT_SOURCE } from "./production-source";

let cached:
  | ReturnType<typeof importAmirantCourseContent>
  | null
  | undefined;

export function getResolvedAmirantProductionContent() {
  if (cached !== undefined) return cached;
  try {
    const imported = importAmirantCourseContent(AMIRANT_PRODUCTION_CONTENT_SOURCE);
    if (
      imported.sourceKind === "production" &&
      imported.readiness === "production_ready" &&
      imported.questionBank.length > 0 &&
      Object.keys(imported.lessonRegistry).length > 0 &&
      imported.practiceSets.length > 0 &&
      imported.simulationBlueprints.length > 0
    ) {
      cached = imported;
      return cached;
    }
    cached = null;
    return null;
  } catch {
    cached = null;
    return null;
  }
}

export function getAmirantContentMode(): "production" | "demo" {
  return getResolvedAmirantProductionContent() ? "production" : "demo";
}
