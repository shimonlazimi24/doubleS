export type PersistMode = "production" | "demo";

export interface PersistedAnswerRow {
  questionId: string;
  topic: string;
  subtopic?: string;
  difficulty: number;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  responseTimeMs?: number;
}

export interface QuizAttemptStartInput {
  quizId: string;
  sourceMode: PersistMode;
  startLevel: number;
}

export interface QuizAttemptSubmitInput {
  attemptId: string;
  quizId: string;
  scorePct: number;
  questionCount: number;
  correctCount: number;
  startLevel: number;
  endLevel: number;
  answers: PersistedAnswerRow[];
}

export interface SimulationAttemptStartInput {
  simulationId: string;
  sourceMode: PersistMode;
  startLevel: number;
}

export interface SimulationSectionSubmitInput {
  attemptId: string;
  sectionIndex: number;
  sectionKind: "pilot" | "scored";
  sectionLabel: string;
  topic: string;
  enterLevel: number;
  questionCount: number;
  correctCount: number;
  timeLimitSec: number;
  elapsedSec?: number;
  answers: PersistedAnswerRow[];
}

export interface SimulationAttemptSubmitInput {
  attemptId: string;
  scorePct: number;
  scoredQuestionCount: number;
  scoredCorrectCount: number;
  startLevel: number;
  endLevel: number;
}

export interface LearningEventInput {
  eventType: string;
  lessonId?: string;
  quizAttemptId?: string;
  simulationAttemptId?: string;
  metadata?: Record<string, unknown>;
}

export interface AdaptiveDecisionEvent {
  sessionId?: string;
  topic: string;
  previousLevel: number;
  selectedLevel: number;
  reason: string;
  streak: { correct: number; wrong: number };
  recentAccuracy?: number;
  questionId?: string;
  timestamp: string;
}

export interface TopicRollupInput {
  topic: string;
  totalAnswered: number;
  totalCorrect: number;
  avgResponseMs?: number;
  byDifficulty: Record<number, { total: number; correct: number }>;
}

export interface AdaptiveStateInput {
  topic: string;
  currentLevel: number;
  correctStreak: number;
  wrongStreak: number;
  recentAccuracy?: number;
  lastQuestionId?: string;
}

export interface CrossTestStateInput {
  lastEndLevel: number;
  lastScorePct: number;
}

export interface AiInsightInput {
  insightKind:
    | "lesson_chat"
    | "quiz_review"
    | "recommendations"
    | "coach_summary";
  model: string;
  promptVersion: string;
  inputRefs: Array<{ chunkId?: string; lessonId?: string; topic?: string }>;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
}

export interface AmirantPersistenceService {
  mode: PersistMode;
  isRemote: boolean;
  hasUser: boolean;
  startQuizAttempt(input: QuizAttemptStartInput): Promise<string>;
  submitQuizAttempt(input: QuizAttemptSubmitInput): Promise<void>;
  startSimulationAttempt(input: SimulationAttemptStartInput): Promise<string>;
  submitSimulationSection(input: SimulationSectionSubmitInput): Promise<void>;
  submitSimulationAttempt(input: SimulationAttemptSubmitInput): Promise<void>;
  appendLearningEvent(input: LearningEventInput): Promise<void>;
  recordAdaptiveDecision(input: AdaptiveDecisionEvent): Promise<void>;
  upsertTopicRollup(input: TopicRollupInput): Promise<void>;
  upsertAdaptiveState(input: AdaptiveStateInput): Promise<void>;
  upsertCrossTestState(input: CrossTestStateInput): Promise<void>;
  saveAiInsight(input: AiInsightInput): Promise<void>;
}
