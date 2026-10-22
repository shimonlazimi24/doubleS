import { importAmirantCourseContent } from "./import";
import { AMIRANT_PRODUCTION_CONTENT_SOURCE } from "./production-source";

/**
 * The full authoring package, imported and gated on readiness.
 *
 * **Build-time and tests only** - it loads `production-source.ts` and with it
 * every JSON file of the package. `scripts/generate-course-manifest.mjs`
 * (through `manifest-source.ts`) and the content quality report are the
 * consumers; request-time code reads `resolved-content.ts` instead.
 *
 * The gate currently fails: `simulations.json` has no pilot section, so
 * `simulationBlueprints` is empty and the hand-authored manifest is used.
 */

let cached: ReturnType<typeof importAmirantCourseContent> | null | undefined;

export function getResolvedAmirantProductionContent() {
  if (cached !== undefined) return cached;
  let imported: ReturnType<typeof importAmirantCourseContent> | null;
  try {
    imported = importAmirantCourseContent(AMIRANT_PRODUCTION_CONTENT_SOURCE);
  } catch {
    imported = null;
  }
  if (
    imported &&
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
}

export function getAmirantContentMode(): "production" | "demo" {
  return getResolvedAmirantProductionContent() ? "production" : "demo";
}
