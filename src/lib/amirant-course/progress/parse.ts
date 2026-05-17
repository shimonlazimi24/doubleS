import { AMIRANT_PREPARATION_COURSE_ID } from "../constants";
import { defaultAmirantProgressState, type AmirantProgressStateV1 } from "./types";

export function safeParse(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

export function parseAmirantProgressState(data: unknown): AmirantProgressStateV1 {
  if (data == null || typeof data !== "object") {
    return defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
  }
  const o = data as Record<string, unknown>;
  if (o.version !== 1 || o.courseId !== AMIRANT_PREPARATION_COURSE_ID) {
    return defaultAmirantProgressState(AMIRANT_PREPARATION_COURSE_ID);
  }
  const lessons = o.lessons;
  if (lessons == null || typeof lessons !== "object") {
    return { version: 1, courseId: AMIRANT_PREPARATION_COURSE_ID, lessons: {} };
  }
  const out: Record<string, { startedAt: string; completedAt?: string }> = {};
  for (const [k, v] of Object.entries(lessons as Record<string, unknown>)) {
    if (v == null || typeof v !== "object") continue;
    const e = v as Record<string, unknown>;
    const startedAt = typeof e.startedAt === "string" ? e.startedAt : undefined;
    const completedAt = typeof e.completedAt === "string" ? e.completedAt : undefined;
    if (startedAt || completedAt) {
      out[k] = {
        startedAt: startedAt ?? completedAt!,
        ...(completedAt ? { completedAt } : {}),
      };
    }
  }
  return { version: 1, courseId: AMIRANT_PREPARATION_COURSE_ID, lessons: out };
}
