import type { ManifestLesson, ManifestModule, ManifestPracticeSet, ManifestQuiz } from "./types/course-manifest";

type PracticeTier = "mod-sc" | "mod-rephrase" | "mod-reading";

/** Demo `mod-sc` and imported `mod-sentence-completion` (and the same for rephrase, reading) map here. */
const TIER_KEY_BY_ID_OR_SLUG: Record<string, PracticeTier> = {
  "mod-sc": "mod-sc",
  "mod-rephrase": "mod-rephrase",
  "mod-reading": "mod-reading",
  "mod-sentence-completion": "mod-sc",
  "mod-sentence-rephrasing": "mod-rephrase",
  "mod-reading-comprehension": "mod-reading",
  "sentence-completion": "mod-sc",
  "sentence-rephrasing": "mod-rephrase",
  "reading-comprehension": "mod-reading",
};

function resolvePracticeTierKey(mod: ManifestModule): PracticeTier | null {
  return TIER_KEY_BY_ID_OR_SLUG[mod.id] ?? TIER_KEY_BY_ID_OR_SLUG[mod.slug ?? ""] ?? null;
}

export type PracticeLevel = "easy" | "intermediate" | "hard";

export function isStructuredPracticeModule(mod: ManifestModule): boolean {
  return resolvePracticeTierKey(mod) != null;
}

/**
 * Optional manifest practice set id per difficulty tier. `null` = not in manifest yet.
 * A single available set is mapped to `intermediate` to avoid duplicating the same set under multiple levels.
 */
const LEVEL_TO_PRACTICE_ID: Record<PracticeTier, Record<PracticeLevel, string | null>> = {
  "mod-sc": { easy: "pr-sc-easy", intermediate: "pr-sc-mid", hard: "pr-sc-hard" },
  "mod-rephrase": { easy: null, intermediate: "pr-rephrase", hard: null },
  "mod-reading": { easy: null, intermediate: "pr-reading", hard: null },
};

export function getPracticeSetForLevel(
  mod: ManifestModule,
  level: PracticeLevel,
): ManifestPracticeSet | null {
  const tierKey = resolvePracticeTierKey(mod);
  if (!tierKey) return null;
  const setId = LEVEL_TO_PRACTICE_ID[tierKey][level] ?? null;
  if (setId) {
    const found = mod.practiceSets.find((p) => p.id === setId);
    if (found) return found;
  }
  // Imported packages use their own `practiceSetId` values, not pr-sc / pr-rephrase.
  if (level === "intermediate" && mod.practiceSets.length === 1) {
    return mod.practiceSets[0] ?? null;
  }
  return null;
}

/** Primary topic adaptive = first listed quiz in module (as authored in manifest). */
export function getPrimaryAdaptiveQuiz(mod: ManifestModule): ManifestQuiz | null {
  return mod.quizzes[0] ?? null;
}

export function getSecondaryAdaptiveQuizzes(mod: ManifestModule): ManifestQuiz[] {
  return mod.quizzes.slice(1);
}

/** שיעורי מסלול מפורשים (שלב 3 סילבוס) — mod-sc */
const SC_GUIDE_LESSON_IDS = ["lesson.sc.01", "lesson.sc.02"] as const;
const SC_VIDEO_LESSON_IDS = ["lesson.sc.03"] as const;

export function isSentenceCompletionModule(mod: ManifestModule): boolean {
  return mod.id === "mod-sc" || mod.slug === "sentence-completion";
}

function lessonsByIds(lessons: ManifestLesson[], ids: readonly string[]): ManifestLesson[] {
  return ids
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is ManifestLesson => l != null);
}

export function getSentenceCompletionGuideLessons(lessons: ManifestLesson[]): ManifestLesson[] {
  return lessonsByIds(lessons, SC_GUIDE_LESSON_IDS);
}

export function getSentenceCompletionVideoLessons(lessons: ManifestLesson[]): ManifestLesson[] {
  return lessonsByIds(lessons, SC_VIDEO_LESSON_IDS);
}
