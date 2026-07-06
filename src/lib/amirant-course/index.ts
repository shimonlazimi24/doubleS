export { AMIRANT_PREPARATION_COURSE_ID, AMIRANT_PREPARATION_SLUG, LS_ANALYTICS, LS_CROSS_TEST, LS_PROGRESS } from "./constants";
export * from "./content-source";
export { AMIRANT_MIN_LEVEL, AMIRANT_MAX_LEVEL, clampDifficultyLevel } from "./difficulty-clamp";
export { gradeAdaptiveQuizOutcomes } from "./session/grade-adaptive-quiz-outcomes";
export type { AmirantLessonProgressEntry, AmirantProgressStateV1 } from "./progress/types";
export { defaultAmirantProgressState } from "./progress/types";
export { loadAmirantProgressState, saveAmirantProgressState, markLessonStartedState, markLessonCompletedState } from "./progress/storage";
export { parseAmirantProgressState } from "./progress/parse";
export type { AmirantProgressService } from "./progress";
export {
  createSupabaseAmirantProgressService,
  loadSupabaseAmirantProgressState,
  createLocalStorageAmirantProgressService,
  emptyProgressState,
} from "./progress";
export {
  countManifestLessons,
  countCompletedLessons,
  courseProgressPercent,
  isLessonComplete,
  isLessonStarted,
} from "./progress/compute";
export type { LessonProgressStatus } from "./progress-calculations";
export { getLessonProgressStatus, moduleProgress } from "./progress-calculations";
export type { AiAnalysisRequest, AiAnalysisResponse } from "./ai/contract";
export { aiAnalysisRequestSchema, aiAnalysisResponseSchema, buildDeterministicAnalysisText } from "./ai/contract";
export type { ContentBlock, LessonContent } from "./types/content-blocks";
export type { CourseManifest, ManifestLesson, ManifestModule, ManifestQuiz, ManifestSimulation } from "./types/course-manifest";
export type { AmirantBankTopicSlug, BankQuestion } from "./types/bank-question";

export { AMIRANT_PREPARATION_MANIFEST, getManifestLesson, getManifestPracticeSet, getManifestQuiz, getSimulation } from "./manifest";
export { AMIRANT_LESSON_REGISTRY, getLessonContent } from "./lesson-registry";
export {
  AMIRANT_BANK_QUESTIONS,
  AMIRANT_GENERAL_BANK_QUESTIONS,
  AMIRANT_QUESTION_POOL,
  AMIRANT_CONTENT_MODE,
  AMIRANT_BANK_MODE,
  getBankQuestion,
  getBankQuestionsByTag,
  getPassage,
  bankQuestionsToPoolItems,
  filterBankByTopics,
  filterBankByTopicsAndVocabMode,
  amirantExamQuestionPromptForDisplay,
  type VocabQuizMode,
  type AmirantPassage,
} from "./question-bank";
export { buildPlacementQuizForm, placementNormalizedScore } from "./session/build-placement-quiz-form";
export type { PlacementQuizForm } from "./session/build-placement-quiz-form";
export {
  loadRecentPlacementForms,
  rememberPlacementForm,
  recentPlacementExclusions,
} from "./adaptive/placement-recent-storage";
export { parseVocabQuizParam, isVocabQuizMode } from "./question-bank/vocab-quiz-mode";
export { pickAdaptiveQuestionIds } from "./adaptive/pick-from-bank";
export { initialInTestLevel, updateInTestLevelAfterAnswer } from "./adaptive/in-test-level";
export { readCrossTestSnapshot, writeCrossTestSnapshot, nextStartLevelFromCrossTest } from "./adaptive/cross-test-storage";
export type { AmirantCourseAnalytics } from "./analytics/types";
export { emptyAnalytics } from "./analytics/types";
export { recordQuestionOutcome, recordSessionEnd, weakTopics, strongTopics } from "./analytics/merge";
export { loadAnalytics, saveAnalytics } from "./analytics/storage";
export { AMIRANT_SIMULATIONS } from "./simulations/definitions";
export { buildAdaptiveQuizQuestionIds } from "./session/build-adaptive-quiz-question-ids";
export { nextSimulationSectionEnterLevel } from "./session/section-level";
export {
  getAmirantCourseFlatLessons,
  getAmirantCourseFirstLessonId,
  getAmirantCourseLessonEntry,
  getAmirantCourseLessonNeighbors,
  getManifestModuleBySlug,
  getModuleByLessonId,
} from "./navigation";
export type { ModuleByLessonId } from "./navigation";
export {
  getCourseModuleOrdinal,
  unitHeadingLineForLessonSidebar,
  lessonHeadingLineForSidebar,
  type SidebarNextLessonProps,
} from "./lesson-sidebar-context";
export {
  getOutlineLessonVisualKind,
  lessonUsesOutlineSubstepAccordion,
  type OutlineLessonVisualKind,
} from "./course-outline-visual-kind";
export {
  getSyllabusUiForModule,
  displayModuleTitleHe,
  getOrderedSyllabusModules,
} from "./syllabus-ui";
export type { SyllabusModuleUi, SyllabusModuleKind } from "./syllabus-ui";
export { getModulePrimaryLessonId, getModuleCtaLabel } from "./module-cta";
export {
  loadStudentDashboardData,
  loadQuizReviewData,
} from "./student-insights";
export type {
  StudentDashboardData,
  QuizReviewData,
  QuizMistakeRow,
  DashboardSeriesPoint,
} from "./student-insights";
export type { NextBestAction, NextBestActionEnriched, NextBestActionKind, NextBestActionContext } from "./next-best-action";
export {
  computeNextBestAction,
  buildNextBestActionForLocal,
  buildNextBestActionAfterQuiz,
  getFirstIncompleteLesson,
  getCourseProgressMeta,
  withNextBestActionEnrichment,
  withNextBestActionEnrichmentFromEnv,
} from "./next-best-action";
