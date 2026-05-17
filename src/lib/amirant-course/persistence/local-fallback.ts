import type {
  AdaptiveDecisionEvent,
  AdaptiveStateInput,
  AiInsightInput,
  AmirantPersistenceService,
  CrossTestStateInput,
  LearningEventInput,
  QuizAttemptStartInput,
  QuizAttemptSubmitInput,
  SimulationAttemptStartInput,
  SimulationAttemptSubmitInput,
  SimulationSectionSubmitInput,
  TopicRollupInput,
} from "./types";

function makeLocalAttemptId(prefix: string): string {
  return `${prefix}-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalFallbackPersistenceService(): AmirantPersistenceService {
  return {
    mode: "demo",
    isRemote: false,
    hasUser: false,
    async startQuizAttempt(_input: QuizAttemptStartInput) {
      return makeLocalAttemptId("quiz");
    },
    async submitQuizAttempt(_input: QuizAttemptSubmitInput) {},
    async startSimulationAttempt(_input: SimulationAttemptStartInput) {
      return makeLocalAttemptId("sim");
    },
    async submitSimulationSection(_input: SimulationSectionSubmitInput) {},
    async submitSimulationAttempt(_input: SimulationAttemptSubmitInput) {},
    async appendLearningEvent(_input: LearningEventInput) {},
    async recordAdaptiveDecision(_input: AdaptiveDecisionEvent) {},
    async upsertTopicRollup(_input: TopicRollupInput) {},
    async upsertAdaptiveState(_input: AdaptiveStateInput) {},
    async upsertCrossTestState(_input: CrossTestStateInput) {},
    async saveAiInsight(_input: AiInsightInput) {},
  };
}
