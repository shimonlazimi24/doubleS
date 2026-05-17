/**
 * Adaptive learning core — three connected concerns:
 * 1) **Adaptive rules** (`adaptive-rules`) — level/streak + derived signals (Wilson reused from `analytics`).
 * 2) **Weak-topic detection** (`weak-topic-detection`) — deterministic mastery per subtopic.
 * 3) **AI tutor contract** (`ai-tutor-contract`) — read-only grounding; no authoritative scores from the model.
 *
 * **Events:** reuse existing `learning_events` (`question_answered`, etc.); adaptive tables are updated
 * after authoritative answer rows — same ordering as `LearningService`.
 *
 * **MVP vs advanced:** MVP uses streak + Wilson; advanced can add IRT, richer RAG, or bandit selection
 * without changing pure function signatures here.
 */

export * from "./adaptive-state.types";
export * from "./adaptive-rules";
export * from "./next-question-selection";
export * from "./weak-topic-detection";
export * from "./ai-tutor-contract";
export * from "./adaptive-facade.types";
