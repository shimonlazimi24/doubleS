/**
 * Course manifest (modules, lessons, quizzes, simulations).
 *
 * Reads the structure generated at build time by
 * `scripts/generate-course-manifest.mjs`. The manifest is 31KB of ids and
 * titles, but it used to be *derived* here from the authoring source — which
 * meant importing `content-source/production-source` and, with it, 2.8MB of
 * lesson, question and retrieval JSON. Every client component that touches the
 * manifest is a browser component, so that whole payload (answer keys included)
 * shipped in a page chunk.
 *
 * `manifest-source.ts` still holds the authoring logic; `manifest-drift.test.ts`
 * asserts the generated file still matches it.
 *
 * For a production CMS: keep the same stable `id` values and this becomes a thin
 * loader over HTTP/DB, exactly as it is over JSON today.
 */
import type { CourseManifest, ManifestQuiz } from "./types/course-manifest";
import generated from "./generated/course-manifest.json";

export const AMIRANT_PREPARATION_MANIFEST = generated as CourseManifest;

/**
 * The resolved simulations, as baked into the manifest. Runtime code reads them
 * here; `simulations/definitions.ts` is the build-time source and reaches the
 * 2.8MB authoring package.
 */
export const AMIRANT_SIMULATIONS = AMIRANT_PREPARATION_MANIFEST.simulations;

export function getManifestQuiz(quizId: string): ManifestQuiz | undefined {
  for (const m of AMIRANT_PREPARATION_MANIFEST.modules) {
    const q = m.quizzes.find((x) => x.id === quizId);
    if (q) return q;
  }
  return undefined;
}

export function getManifestLesson(lessonId: string) {
  for (const m of AMIRANT_PREPARATION_MANIFEST.modules) {
    const l = m.lessons.find((x) => x.id === lessonId);
    if (l) return { lesson: l, module: m };
  }
  return undefined;
}

export function getManifestPracticeSet(setId: string) {
  for (const m of AMIRANT_PREPARATION_MANIFEST.modules) {
    const p = m.practiceSets.find((x) => x.id === setId);
    if (p) return { set: p, module: m };
  }
  return undefined;
}

export function getSimulation(id: string) {
  return AMIRANT_PREPARATION_MANIFEST.simulations.find((s) => s.id === id);
}
