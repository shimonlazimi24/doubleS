/**
 * Live product path uses Amirant persistence (`amirant_*`).
 * Only pure adaptive helpers under `./adaptive` (+ analytics helpers) are imported.
 * LearningService was removed — it was never called from the app.
 */
export * from "./adaptive";
export * from "./analytics";
