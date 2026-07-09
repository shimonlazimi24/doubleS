/**
 * סנכרון מלא בין `content/amirnet-course` (מפת NAVIGATION.md) לבין מניפסט הקורס ו־lesson registry.
 * כל שיעור = `amirnetMarkdownRel` + (לעיתים) תרגול/מבחן אדפטיבי כמו ב־MVP.
 */
import type { LessonContent } from "./types/content-blocks";
import type { ManifestModule } from "./types/course-manifest";
import { buildManifestQuiz, takeQuestionIds, takeQuestionIdsByDifficulty } from "./manifest-quiz-helpers";

const Q = buildManifestQuiz;

function Lm(lessonId: string, rel: string): LessonContent {
  return { lessonId, blocks: [], amirnetMarkdownRel: rel };
}

type Pair = readonly [id: string, rel: string];

const PAIRS: Pair[] = [
  // -- אוצר מילים (20) --
  ["lesson.vocab.01", "03_vocabulary/vocabulary_1_easy_part_a_verbs.md"],
  ["lesson.vocab.02", "03_vocabulary/vocabulary_1_easy_part_b_nouns.md"],
  ["lesson.vocab.03", "03_vocabulary/vocabulary_1_easy_part_c_adjectives.md"],
  ["lesson.vocab.04", "03_vocabulary/vocabulary_1_easy_part_d_adverbs_connectives.md"],
  ["lesson.vocab.05", "03_vocabulary/vocabulary_2_intermediate_part_a_verbs.md"],
  ["lesson.vocab.06", "03_vocabulary/vocabulary_2_intermediate_part_b_nouns.md"],
  ["lesson.vocab.07", "03_vocabulary/vocabulary_2_intermediate_part_c_adjectives.md"],
  ["lesson.vocab.08", "03_vocabulary/vocabulary_2_intermediate_part_d_adverbs_connectives.md"],
  ["lesson.vocab.09", "03_vocabulary/vocabulary_3_advanced_part_a_verbs.md"],
  ["lesson.vocab.10", "03_vocabulary/vocabulary_3_advanced_part_b_nouns.md"],
  ["lesson.vocab.11", "03_vocabulary/vocabulary_3_advanced_part_c_adjectives.md"],
  ["lesson.vocab.12", "03_vocabulary/vocabulary_3_advanced_part_d_adverbs_connectives.md"],
  ["lesson.vocab.13", "03_vocabulary/vocabulary_4_expert_part_a_verbs.md"],
  ["lesson.vocab.14", "03_vocabulary/vocabulary_4_expert_part_b_nouns.md"],
  ["lesson.vocab.15", "03_vocabulary/vocabulary_4_expert_part_c_adjectives.md"],
  ["lesson.vocab.16", "03_vocabulary/vocabulary_4_expert_part_d_adverbs_connectives.md"],
  ["lesson.vocab.17", "03_vocabulary/vocabulary_phrasal_verbs.md"],
  ["lesson.vocab.18", "03_vocabulary/vocabulary_advanced_connectives.md"],
  ["lesson.vocab.19", "03_vocabulary/vocabulary_5_mastery_level.md"],
  ["lesson.vocab.20", "03_vocabulary/SAMPLE_vocabulary_package_100_words.md"],
  // -- השלמת משפטים (11) --
  ["lesson.sc.01", "04_sentence_completion/4.2_solving_methods_master_guide.md"],
  ["lesson.sc.02", "04_sentence_completion/4.3_common_traps_guide.md"],
  ["lesson.sc.03", "04_sentence_completion/SAMPLE_video_script_5_solving_methods.md"],
  ["lesson.sc.04", "04_sentence_completion/practice_quizzes/SAMPLE_sc_quiz_1_easy.md"],
  ["lesson.sc.05", "04_sentence_completion/practice_quizzes/sc_quiz_2_easy.md"],
  ["lesson.sc.06", "04_sentence_completion/practice_quizzes/sc_quiz_3_intermediate.md"],
  ["lesson.sc.07", "04_sentence_completion/practice_quizzes/sc_quiz_4_intermediate.md"],
  ["lesson.sc.08", "04_sentence_completion/practice_quizzes/sc_quiz_5_hard.md"],
  ["lesson.sc.09", "04_sentence_completion/practice_quizzes/sc_quiz_6_hard.md"],
  ["lesson.sc.10", "04_sentence_completion/practice_quizzes/sc_quiz_7_mixed.md"],
  ["lesson.sc.11", "04_sentence_completion/practice_quizzes/sc_quiz_8_mixed.md"],
  // -- ניסוח מחדש (12) --
  ["lesson.rephrase.01", "05_restatement/5.2_solving_methods_master_guide.md"],
  ["lesson.rephrase.02", "05_restatement/5.3_sentence_structures_guide.md"],
  ["lesson.rephrase.03", "05_restatement/5.4_common_traps_guide.md"],
  ["lesson.rephrase.04", "05_restatement/practice_quizzes/SAMPLE_restatement_quiz_intermediate.md"],
  ["lesson.rephrase.05", "05_restatement/practice_quizzes/restatement_quiz_1_easy.md"],
  ["lesson.rephrase.06", "05_restatement/practice_quizzes/restatement_quiz_2_easy.md"],
  ["lesson.rephrase.07", "05_restatement/practice_quizzes/restatement_quiz_3_intermediate.md"],
  ["lesson.rephrase.08", "05_restatement/practice_quizzes/restatement_quiz_4_intermediate.md"],
  ["lesson.rephrase.09", "05_restatement/practice_quizzes/restatement_quiz_5_hard.md"],
  ["lesson.rephrase.10", "05_restatement/practice_quizzes/restatement_quiz_6_hard.md"],
  ["lesson.rephrase.11", "05_restatement/practice_quizzes/restatement_quiz_7_mixed.md"],
  ["lesson.rephrase.12", "05_restatement/practice_quizzes/restatement_quiz_8_mixed.md"],
  // -- הבנת הנקרא (12) --
  ["lesson.reading.01", "06_reading_comprehension/6.2_solving_methods_master_guide.md"],
  ["lesson.reading.02", "06_reading_comprehension/6.3_paragraph_structure_guide.md"],
  ["lesson.reading.03", "06_reading_comprehension/6.6_common_traps_guide.md"],
  ["lesson.reading.04", "06_reading_comprehension/practice_quizzes/SAMPLE_reading_comp_quiz_intermediate.md"],
  ["lesson.reading.05", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_1_easy.md"],
  ["lesson.reading.06", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_2_easy.md"],
  ["lesson.reading.07", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_3_intermediate.md"],
  ["lesson.reading.08", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_4_intermediate.md"],
  ["lesson.reading.09", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_5_hard.md"],
  ["lesson.reading.10", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_6_hard.md"],
  ["lesson.reading.11", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_7_mixed.md"],
  ["lesson.reading.12", "06_reading_comprehension/practice_quizzes/reading_comp_quiz_8_mixed.md"],
  // -- רפורמה 2026 (9) --
  ["lesson.reform.01", "07_new_reform_audio_writing/7.1_reform_overview.md"],
  ["lesson.reform.02", "07_new_reform_audio_writing/7.2_listening_guide.md"],
  ["lesson.reform.03", "07_new_reform_audio_writing/7.3_listening_practice_quizzes.md"],
  ["lesson.reform.04", "07_new_reform_audio_writing/7.4_word_formation_guide.md"],
  ["lesson.reform.05", "07_new_reform_audio_writing/7.5_word_formation_practice.md"],
  ["lesson.reform.06", "07_new_reform_audio_writing/7.6_grammar_in_context_guide.md"],
  ["lesson.reform.07", "07_new_reform_audio_writing/7.7_grammar_practice.md"],
  ["lesson.reform.08", "07_new_reform_audio_writing/7.8_writing_guide.md"],
  ["lesson.reform.09", "07_new_reform_audio_writing/7.9_writing_examples_and_practice.md"],
  // -- סימולציות (7) --
  ["lesson.sim.01", "08_full_simulations/8.1_how_to_run_simulation.md"],
  ["lesson.sim.02", "08_full_simulations/8.2_reading_simulation_report.md"],
  ["lesson.sim.03", "08_full_simulations/8.3_progress_tracking_sheet.md"],
  ["lesson.sim.04", "08_full_simulations/simulation_1_baseline.md"],
  ["lesson.sim.05", "08_full_simulations/simulation_2_warmup.md"],
  ["lesson.sim.06", "08_full_simulations/simulation_3_challenge.md"],
  ["lesson.sim.07", "08_full_simulations/simulation_4_final.md"],
  // -- טיפים + סיכום --
  ["lesson.tips.01", "09_winning_tips/unit_9_winning_tips_and_strategies.md"],
  ["lesson.summary.01", "10_summary_feedback/unit_10_summary_and_feedback.md"],
];

export const AMIRNET_SYNC_LESSON_REGISTRY: Record<string, LessonContent> = Object.fromEntries(
  PAIRS.map(([id, rel]) => [id, Lm(id, rel)]),
);

const VOCAB: ManifestModule = {
  id: "mod-vocab",
  slug: "vocabulary",
  title: "מילון מושגים",
  sortOrder: 1,
  lessons: [
    { id: "lesson.vocab.01", title: "אוצר מילים · קל - פעלים", kind: "mixed", estimatedMinutes: 35, videoSlot: true, practiceSetId: "pr-vocab-1", quizId: "quiz-vocab" },
    { id: "lesson.vocab.02", title: "אוצר מילים · קל - שמות עצם", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.03", title: "אוצר מילים · קל - תוארים", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.04", title: "אוצר מילים · קל - תוארי־מעוף/קישור", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.05", title: "אוצר מילים · בינוני - פעלים", kind: "text", estimatedMinutes: 30, quizId: "quiz-vocab-2" },
    { id: "lesson.vocab.06", title: "אוצר מילים · בינוני - שמות עצם", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.07", title: "אוצר מילים · בינוני - תוארים", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.08", title: "אוצר מילים · בינוני - תוארי־מעוף/קישור", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.09", title: "אוצר מילים · מתקדמים - פעלים", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.10", title: "אוצר מילים · מתקדמים - שמות עצם", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.11", title: "אוצר מילים · מתקדמים - תוארים", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.12", title: "אוצר מילים · מתקדמים - תוארי־מעוף/קישור", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.13", title: "אוצר מילים · מומחה - פעלים", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.14", title: "אוצר מילים · מומחה - שמות עצם", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.15", title: "אוצר מילים · מומחה - תוארים", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.16", title: "אוצר מילים · מומחה - תוארי־מעוף/קישור", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.vocab.17", title: "Phrasal verbs", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.vocab.18", title: "Connectives (מתקדמים)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.vocab.19", title: "Mastery level", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.vocab.20", title: "דוגמה: חבילה 100 מילים", kind: "text", estimatedMinutes: 20 },
  ],
  practiceSets: [{ id: "pr-vocab-1", title: "High-frequency items", questionIds: takeQuestionIds("vocabulary", 10) }],
  quizzes: [
    {
      id: "quiz-landing-taste",
      title: "מבחן היכרות קצר (דוגמה)",
      adaptive: true,
      questionCount: 10,
      timeLimitSec: 20 * 60,
      topicSlugs: ["reading_comprehension", "sentence_completion"],
      minInTestLevel: 3,
    },
    Q("quiz-vocab", "Vocabulary adaptive", ["vocabulary"]),
    Q("quiz-vocab-2", "Vocabulary + sentence completion", ["vocabulary", "sentence_completion"]),
  ],
};

const SENT: ManifestModule = {
  id: "mod-sc",
  slug: "sentence-completion",
  title: "השלמת משפטים",
  sortOrder: 2,
  lessons: [
    {
      id: "lesson.sc.01",
      title: "4.2 - מדריך (כתוב) · מסלול אודיו (במסמך)",
      kind: "text",
      estimatedMinutes: 40,
      videoSlot: true,
      practiceSetId: "pr-sc-mid",
      quizId: "quiz-sc",
    },
    { id: "lesson.sc.02", title: "4.3 - מלכודות נפוצות", kind: "text", estimatedMinutes: 25, quizId: "quiz-sc-2" },
    { id: "lesson.sc.03", title: "סרטון הדרכה - 5 שיטות (תסריט / וידאו)", kind: "video", estimatedMinutes: 15 },
    { id: "lesson.sc.04", title: "מבחן תרגול - דוגמה (קל)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.05", title: "מבחן תרגול 2 (קל)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.06", title: "מבחן תרגול 3 (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.07", title: "מבחן תרגול 4 (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.08", title: "מבחן תרגול 5 (קשה)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.09", title: "מבחן תרגול 6 (קשה)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.10", title: "מבחן תרגול 7 (מעורב)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.sc.11", title: "מבחן תרגול 8 (מעורב)", kind: "text", estimatedMinutes: 25 },
  ],
  practiceSets: [
    {
      id: "pr-sc-easy",
      title: "השלמת משפטים - מקבץ קל (רמות 1–2)",
      questionIds: takeQuestionIdsByDifficulty("sentence_completion", 10, 1, 2),
    },
    {
      id: "pr-sc-mid",
      title: "השלמת משפטים - מקבץ בינוני (רמות 3–4)",
      questionIds: takeQuestionIdsByDifficulty("sentence_completion", 10, 3, 4),
    },
    {
      id: "pr-sc-hard",
      title: "השלמת משפטים - מקבץ גבוה (רמות 5–6)",
      questionIds: takeQuestionIdsByDifficulty("sentence_completion", 10, 5, 6),
    },
  ],
  quizzes: [Q("quiz-sc", "Sentence completion adaptive", ["sentence_completion"]), Q("quiz-sc-2", "Mixed SC + vocabulary", ["sentence_completion", "vocabulary"])],
};

const REPH: ManifestModule = {
  id: "mod-rephrase",
  slug: "sentence-rephrasing",
  title: "ניסוח מחדש",
  sortOrder: 3,
  lessons: [
    { id: "lesson.rephrase.01", title: "ניסוח מחדש - שיטות (5.2)", kind: "mixed", estimatedMinutes: 35, videoSlot: true, practiceSetId: "pr-rephrase", quizId: "quiz-rephrase" },
    { id: "lesson.rephrase.02", title: "ניסוח מחדש - מבני משפט (5.3)", kind: "text", estimatedMinutes: 30, quizId: "quiz-rephrase-2" },
    { id: "lesson.rephrase.03", title: "ניסוח מחדש - מלכודות (5.4)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.04", title: "מבחן תרגול - דוגמה (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.05", title: "מבחן תרגול 1 (קל)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.06", title: "מבחן תרגול 2 (קל)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.07", title: "מבחן תרגול 3 (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.08", title: "מבחן תרגול 4 (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.09", title: "מבחן תרגול 5 (קשה)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.10", title: "מבחן תרגול 6 (קשה)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.11", title: "מבחן תרגול 7 (מעורב)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.rephrase.12", title: "מבחן תרגול 8 (מעורב)", kind: "text", estimatedMinutes: 25 },
  ],
  practiceSets: [{ id: "pr-rephrase", title: "Rephrasing set", questionIds: takeQuestionIds("rephrasing", 10) }],
  quizzes: [Q("quiz-rephrase", "Rephrasing adaptive", ["rephrasing"]), Q("quiz-rephrase-2", "Rephrase + reading", ["rephrasing", "reading_comprehension"])],
};

const READ: ManifestModule = {
  id: "mod-reading",
  slug: "reading-comprehension",
  title: "קטעי קריאה",
  sortOrder: 4,
  lessons: [
    { id: "lesson.reading.01", title: "קריאה - שיטות (6.2)", kind: "mixed", estimatedMinutes: 40, videoSlot: true, practiceSetId: "pr-reading", quizId: "quiz-reading" },
    { id: "lesson.reading.02", title: "קריאה - מבנה פסקה (6.3)", kind: "text", estimatedMinutes: 25, quizId: "quiz-reading-2" },
    { id: "lesson.reading.03", title: "קריאה - מלכודות (6.6)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.04", title: "מבחן תרגול - דוגמה (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.05", title: "מבחן תרגול 1 (קל)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.06", title: "מבחן תרגול 2 (קל)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.07", title: "מבחן תרגול 3 (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.08", title: "מבחן תרגול 4 (בינוני)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.09", title: "מבחן תרגול 5 (קשה)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.10", title: "מבחן תרגול 6 (קשה)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.11", title: "מבחן תרגול 7 (מעורב)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.reading.12", title: "מבחן תרגול 8 (מעורב)", kind: "text", estimatedMinutes: 25 },
  ],
  practiceSets: [{ id: "pr-reading", title: "Reading set", questionIds: takeQuestionIds("reading_comprehension", 10) }],
  quizzes: [Q("quiz-reading", "Reading adaptive", ["reading_comprehension"]), Q("quiz-reading-2", "Reading + rephrasing", ["reading_comprehension", "rephrasing"])],
};

const REF: ManifestModule = {
  id: "mod-reform",
  slug: "new-exam-format-2026",
  title: "רפורמה 2026",
  sortOrder: 5,
  lessons: [
    { id: "lesson.reform.01", title: "רפורמה - סקירה (7.1)", kind: "mixed", estimatedMinutes: 30, videoSlot: true, practiceSetId: "pr-reform", quizId: "quiz-reform" },
    { id: "lesson.reform.02", title: "Listening (7.2)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.03", title: "מבחני שמיעה (7.3)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.04", title: "Word formation (7.4)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.05", title: "תרגול word formation (7.5)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.06", title: "Grammar in context (7.6)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.07", title: "תרגול grammar (7.7)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.08", title: "Writing (7.8)", kind: "text", estimatedMinutes: 35, quizId: "quiz-reform-2" },
    { id: "lesson.reform.09", title: "דוגמאות וכתיבה (7.9)", kind: "text", estimatedMinutes: 30 },
  ],
  practiceSets: [
    { id: "pr-reform", title: "Mixed skills", questionIds: [...takeQuestionIds("vocabulary", 4), ...takeQuestionIds("sentence_completion", 4)] },
  ],
  quizzes: [
    Q("quiz-reform", "Mixed adaptive (2026 prep)", ["vocabulary", "sentence_completion", "rephrasing"]),
    Q("quiz-reform-2", "Full-topic mix", ["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"]),
  ],
};

const SIM: ManifestModule = {
  id: "mod-sims",
  slug: "full-simulations",
  title: "סימולציות מלאות",
  sortOrder: 6,
  lessons: [
    { id: "lesson.sim.01", title: "איך להריץ סימולציה (8.1)", kind: "text", estimatedMinutes: 20 },
    { id: "lesson.sim.02", title: "קריאת דוח סימולציה (8.2)", kind: "text", estimatedMinutes: 20 },
    { id: "lesson.sim.03", title: "גיליון מעקב (8.3)", kind: "text", estimatedMinutes: 20 },
    { id: "lesson.sim.04", title: "סימולציה 1 - Baseline", kind: "text", estimatedMinutes: 45, videoSlot: true },
    { id: "lesson.sim.05", title: "סימולציה 2 - Warmup", kind: "text", estimatedMinutes: 45, videoSlot: true },
    { id: "lesson.sim.06", title: "סימולציה 3 - Challenge", kind: "text", estimatedMinutes: 45, videoSlot: true },
    { id: "lesson.sim.07", title: "סימולציה 4 - Final", kind: "text", estimatedMinutes: 45, videoSlot: true },
  ],
  practiceSets: [],
  quizzes: [],
};

const TIP: ManifestModule = {
  id: "mod-tips",
  slug: "tips-strategies",
  title: "טיפים ואסטרטגיות",
  sortOrder: 7,
  lessons: [
    { id: "lesson.tips.01", title: "טיפים מנצחים (יחידה 9)", kind: "mixed", estimatedMinutes: 25, practiceSetId: "pr-tips", quizId: "quiz-tips" },
  ],
  practiceSets: [{ id: "pr-tips", title: "Quick mixed practice", questionIds: takeQuestionIds("sentence_completion", 8) }],
  quizzes: [Q("quiz-tips", "Strategies check (mixed)", ["sentence_completion", "reading_comprehension"])],
};

const SUM: ManifestModule = {
  id: "mod-summary",
  slug: "course-summary",
  title: "סיכום הקורס",
  sortOrder: 8,
  lessons: [
    { id: "lesson.summary.01", title: "סיכום הקורס ומשוב (יחידה 10)", kind: "text", estimatedMinutes: 20, quizId: "quiz-final" },
  ],
  practiceSets: [],
  quizzes: [Q("quiz-final", "Final adaptive review", ["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"])],
};

/** מודולי תוכן שמקורם ב־NAVIGATION / תיקיית `content/amirnet-course` (ללא מבוא). */
export const AMIRNET_CONTENT_MODULES: ManifestModule[] = [VOCAB, SENT, REPH, READ, REF, SIM, TIP, SUM];
