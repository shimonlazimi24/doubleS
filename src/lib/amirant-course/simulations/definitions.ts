import type { ManifestSimulation } from "../types/course-manifest";
import { getResolvedAmirantProductionContent } from "../content-source/resolved-content";

/** Scored sections: 8+8+9+14 min = 39 min. Pilot separate (not in 39). */
const SCORED_TIMES = [
  { label: "Sentence completion - block A", seconds: 8 * 60, topicSlug: "sentence_completion" as const, questionCount: 4 },
  { label: "Sentence completion - block B", seconds: 8 * 60, topicSlug: "sentence_completion" as const, questionCount: 4 },
  { label: "Vocabulary & rephrasing mix", seconds: 9 * 60, topicSlug: "vocabulary" as const, questionCount: 4 },
  { label: "Reading comprehension", seconds: 14 * 60, topicSlug: "reading_comprehension" as const, questionCount: 4 },
];

function sim(id: string, title: string): ManifestSimulation {
  return {
    id,
    title,
    pilot: { seconds: 5 * 60, questionCount: 2, topicSlug: "reading_comprehension" },
    sections: SCORED_TIMES.map((s) => ({ ...s })),
  };
}

/** Six full simulations - progressive titles; same structure, bank supplies fresh items. */
const DEMO_SIMULATIONS: ManifestSimulation[] = [
  sim("sim-01", "סימולציה 1 - Baseline"),
  sim("sim-02", "סימולציה 2 - Warm-up"),
  sim("sim-03", "סימולציה 3 - Challenge"),
  sim("sim-04", "סימולציה 4 - Exam conditions"),
  sim("sim-05", "סימולציה 5 - Final rehearsal A"),
  sim("sim-06", "סימולציה 6 - Final rehearsal B"),
];

const imported = getResolvedAmirantProductionContent();
export const AMIRANT_SIMULATIONS: ManifestSimulation[] =
  imported?.simulationBlueprints.length
    ? imported.simulationBlueprints
    : DEMO_SIMULATIONS;
