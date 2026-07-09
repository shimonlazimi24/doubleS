import type { EventVersion } from "./domain";
import type { LearningEventEnvelopeValidated } from "./learning-event-metadata";

export type { EventVersion };

/**
 * Append-only catalog + Zod metadata - see `learning-event-metadata.ts` for schemas.
 */
export {
  LEARNING_EVENT_TYPES,
  LEARNING_EVENT_METADATA_SCHEMAS,
  validateLearningEventMetadata,
  createLearningEventEnvelope,
  type LearningEventMetadata,
  type LearningEventMetadataByType,
  type LearningEventType,
  type CreateLearningEventEnvelopeInput,
  type CreateLearningEventEnvelopeResult,
  type LearningEventEnvelopeValidated,
  type ValidateMetadataResult,
} from "./learning-event-metadata";

/**
 * Stored row shape for `learning_events`.
 * Always create via `createLearningEventEnvelope` so `metadata` is Zod-validated.
 */
export type LearningEventEnvelope = LearningEventEnvelopeValidated;

/** @deprecated Prefer Zod schema field names in `learning-event-metadata.ts`. */
export const METADATA_KEYS = {
  videoPositionSec: "videoPositionSec",
  videoDeltaSec: "videoDeltaSec",
  durationWatchedSec: "durationWatchedSec",
  scorePctSnapshot: "scorePctSnapshot",
  selectedOptionId: "selectedOptionId",
  recommendationId: "recommendationId",
  aiThreadId: "aiThreadId",
  source: "source",
} as const;

/** Example: idempotent ingest from client - hash(userId+type+lessonId+minuteBucket). */
export function buildDedupeKey(parts: string[]): string {
  return parts.join(":");
}
