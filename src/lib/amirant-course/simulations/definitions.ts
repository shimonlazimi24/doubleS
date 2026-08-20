import type { ManifestSimulation } from "../types/course-manifest";
import { getResolvedAmirantProductionContent } from "../content-source/resolved-content";
import {
  EXAM_PILOT,
  EXAM_SCORED_MINUTES,
  EXAM_SCORED_QUESTION_COUNT,
  EXAM_SCORED_SEGMENTS,
} from "../exam-facts";

/**
 * A simulation mirrors the real exam segment for segment — it is derived from
 * `exam-facts.ts` rather than described again here, so the structure a student
 * practises can never drift from the structure the course advertises.
 *
 * Previously this file declared its own four-section layout (16 questions) whose
 * third section was labelled "אוצר מילים וניסוח מחדש" but drew vocabulary items,
 * so restatement never appeared in a timed run at all.
 */
const SCORED_SECTIONS = EXAM_SCORED_SEGMENTS.map((segment) => ({
  label: segment.labelHe,
  seconds: segment.minutes * 60,
  topicSlug: segment.type,
  questionCount: segment.questionCount,
}));

/**
 * The pilot segment is unscored, and it deliberately does **not** use reading
 * comprehension: passages are the scarcest resource in the bank, and every one
 * spent on a warm-up is a passage a scored section cannot use.
 */
const PILOT_SECTION = {
  seconds: Math.min(5, EXAM_PILOT.maxMinutes) * 60,
  questionCount: 2,
  topicSlug: "vocabulary" as const,
};

function sim(id: string, title: string): ManifestSimulation {
  return {
    id,
    title,
    pilot: { ...PILOT_SECTION },
    sections: SCORED_SECTIONS.map((s) => ({ ...s })),
  };
}

/** Six full simulations — identical structure, fresh items drawn from the bank. */
const DEMO_SIMULATIONS: ManifestSimulation[] = [
  sim("sim-01", "סימולציה 1 · מדידת פתיחה"),
  sim("sim-02", "סימולציה 2 · חימום"),
  sim("sim-03", "סימולציה 3 · אתגר"),
  sim("sim-04", "סימולציה 4 · תנאי מבחן"),
  sim("sim-05", "סימולציה 5 · חזרה גנרלית א׳"),
  sim("sim-06", "סימולציה 6 · חזרה גנרלית ב׳"),
];

/** Guards the invariant at module load: a simulation that does not match the
 *  published exam structure is a broken promise, not a configuration choice. */
const declaredQuestions = SCORED_SECTIONS.reduce((sum, s) => sum + s.questionCount, 0);
const declaredMinutes = SCORED_SECTIONS.reduce((sum, s) => sum + s.seconds / 60, 0);
if (declaredQuestions !== EXAM_SCORED_QUESTION_COUNT || declaredMinutes !== EXAM_SCORED_MINUTES) {
  throw new Error(
    `Simulation blueprint drifted from exam-facts: ${declaredQuestions}q/${declaredMinutes}min ` +
      `vs ${EXAM_SCORED_QUESTION_COUNT}q/${EXAM_SCORED_MINUTES}min`,
  );
}

export const AMIRANT_SIMULATION_COUNT = DEMO_SIMULATIONS.length;

const imported = getResolvedAmirantProductionContent();
export const AMIRANT_SIMULATIONS: ManifestSimulation[] =
  imported?.simulationBlueprints.length
    ? imported.simulationBlueprints
    : DEMO_SIMULATIONS;
