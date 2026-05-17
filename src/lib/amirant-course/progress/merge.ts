import type { AmirantLessonProgressEntry, AmirantProgressStateV1 } from "./types";

function entryTimestamp(entry: AmirantLessonProgressEntry): number {
  const t = entry.completedAt ?? entry.startedAt;
  return Date.parse(t) || 0;
}

/**
 * Merge local and remote lesson progress (latest completion wins; earliest start wins).
 */
export function mergeAmirantProgressStates(
  local: AmirantProgressStateV1,
  remote: AmirantProgressStateV1,
): { merged: AmirantProgressStateV1; lessonsToUpload: string[] } {
  const lessons: AmirantProgressStateV1["lessons"] = { ...remote.lessons };
  const lessonsToUpload = new Set<string>();

  for (const [lessonId, localEntry] of Object.entries(local.lessons)) {
    const remoteEntry = lessons[lessonId];
    if (!remoteEntry) {
      lessons[lessonId] = localEntry;
      lessonsToUpload.add(lessonId);
      continue;
    }
    const localComplete = localEntry.completedAt;
    const remoteComplete = remoteEntry.completedAt;
    const startedAt =
      Date.parse(localEntry.startedAt) <= Date.parse(remoteEntry.startedAt)
        ? localEntry.startedAt
        : remoteEntry.startedAt;
    if (localComplete && remoteComplete) {
      const pickLocal = entryTimestamp(localEntry) >= entryTimestamp(remoteEntry);
      const picked = pickLocal ? localEntry : remoteEntry;
      if (pickLocal && picked.completedAt !== remoteComplete) {
        lessonsToUpload.add(lessonId);
      }
      lessons[lessonId] = { startedAt, completedAt: picked.completedAt };
    } else if (localComplete && !remoteComplete) {
      lessons[lessonId] = { startedAt, completedAt: localComplete };
      lessonsToUpload.add(lessonId);
    } else if (!localComplete && remoteComplete) {
      lessons[lessonId] = { startedAt, completedAt: remoteComplete };
    } else {
      const changedStart = startedAt !== remoteEntry.startedAt;
      lessons[lessonId] = { startedAt };
      if (changedStart) lessonsToUpload.add(lessonId);
    }
  }

  return {
    merged: { version: 1, courseId: local.courseId, lessons },
    lessonsToUpload: Array.from(lessonsToUpload),
  };
}
