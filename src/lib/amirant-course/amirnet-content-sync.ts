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
  // -- השלמת משפטים (17) --
  ["lesson.sc.01", "04_sentence_completion/4.2_solving_methods_master_guide.md"],
  ["lesson.sc.02", "04_sentence_completion/4.3_common_traps_guide.md"],
  ["lesson.sc.03", "04_sentence_completion/SAMPLE_video_script_5_solving_methods.md"],
  // The content owner's sentence-completion tests: 14 tests of 8. (The eight
  // markdown practice quizzes this replaced stay under practice_quizzes/: no
  // longer lessons, but their questions still feed the adaptive pool.)
  ["lesson.sc.test-01", "04_sentence_completion/owner_tests/sc_test_01.md"],
  ["lesson.sc.test-02", "04_sentence_completion/owner_tests/sc_test_02.md"],
  ["lesson.sc.test-03", "04_sentence_completion/owner_tests/sc_test_03.md"],
  ["lesson.sc.test-04", "04_sentence_completion/owner_tests/sc_test_04.md"],
  ["lesson.sc.test-05", "04_sentence_completion/owner_tests/sc_test_05.md"],
  ["lesson.sc.test-06", "04_sentence_completion/owner_tests/sc_test_06.md"],
  ["lesson.sc.test-07", "04_sentence_completion/owner_tests/sc_test_07.md"],
  ["lesson.sc.test-08", "04_sentence_completion/owner_tests/sc_test_08.md"],
  ["lesson.sc.test-09", "04_sentence_completion/owner_tests/sc_test_09.md"],
  ["lesson.sc.test-10", "04_sentence_completion/owner_tests/sc_test_10.md"],
  ["lesson.sc.test-11", "04_sentence_completion/owner_tests/sc_test_11.md"],
  ["lesson.sc.test-12", "04_sentence_completion/owner_tests/sc_test_12.md"],
  ["lesson.sc.test-13", "04_sentence_completion/owner_tests/sc_test_13.md"],
  ["lesson.sc.test-14", "04_sentence_completion/owner_tests/sc_test_14.md"],
  // -- ניסוח מחדש (17) --
  ["lesson.rephrase.01", "05_restatement/5.2_solving_methods_master_guide.md"],
  ["lesson.rephrase.02", "05_restatement/5.3_sentence_structures_guide.md"],
  ["lesson.rephrase.03", "05_restatement/5.4_common_traps_guide.md"],
  // The content owner's restatement sets: 14 sets of 4, easiest to hardest.
  // (The nine markdown practice quizzes this replaced stay under practice_quizzes/:
  // they are no longer lessons, but their questions still feed the adaptive pool.)
  ["lesson.rephrase.set-01", "05_restatement/owner_sets/rs_set_01.md"],
  ["lesson.rephrase.set-02", "05_restatement/owner_sets/rs_set_02.md"],
  ["lesson.rephrase.set-03", "05_restatement/owner_sets/rs_set_03.md"],
  ["lesson.rephrase.set-04", "05_restatement/owner_sets/rs_set_04.md"],
  ["lesson.rephrase.set-05", "05_restatement/owner_sets/rs_set_05.md"],
  ["lesson.rephrase.set-06", "05_restatement/owner_sets/rs_set_06.md"],
  ["lesson.rephrase.set-07", "05_restatement/owner_sets/rs_set_07.md"],
  ["lesson.rephrase.set-08", "05_restatement/owner_sets/rs_set_08.md"],
  ["lesson.rephrase.set-09", "05_restatement/owner_sets/rs_set_09.md"],
  ["lesson.rephrase.set-10", "05_restatement/owner_sets/rs_set_10.md"],
  ["lesson.rephrase.set-11", "05_restatement/owner_sets/rs_set_11.md"],
  ["lesson.rephrase.set-12", "05_restatement/owner_sets/rs_set_12.md"],
  ["lesson.rephrase.set-13", "05_restatement/owner_sets/rs_set_13.md"],
  ["lesson.rephrase.set-14", "05_restatement/owner_sets/rs_set_14.md"],
  // -- הבנת הנקרא (13) --
  ["lesson.reading.01", "06_reading_comprehension/6.2_solving_methods_master_guide.md"],
  ["lesson.reading.02", "06_reading_comprehension/6.3_paragraph_structure_guide.md"],
  ["lesson.reading.03", "06_reading_comprehension/6.6_common_traps_guide.md"],
  // The content owner's reading passages: 10 passages, 5-6 questions each. (The
  // markdown practice quizzes this replaced stay under practice_quizzes/: no
  // longer lessons, but their questions and passages still feed the adaptive pool.)
  ["lesson.reading.passage-01", "06_reading_comprehension/owner_passages/rc_passage_01.md"],
  ["lesson.reading.passage-02", "06_reading_comprehension/owner_passages/rc_passage_02.md"],
  ["lesson.reading.passage-03", "06_reading_comprehension/owner_passages/rc_passage_03.md"],
  ["lesson.reading.passage-04", "06_reading_comprehension/owner_passages/rc_passage_04.md"],
  ["lesson.reading.passage-05", "06_reading_comprehension/owner_passages/rc_passage_05.md"],
  ["lesson.reading.passage-06", "06_reading_comprehension/owner_passages/rc_passage_06.md"],
  ["lesson.reading.passage-07", "06_reading_comprehension/owner_passages/rc_passage_07.md"],
  ["lesson.reading.passage-08", "06_reading_comprehension/owner_passages/rc_passage_08.md"],
  ["lesson.reading.passage-09", "06_reading_comprehension/owner_passages/rc_passage_09.md"],
  ["lesson.reading.passage-10", "06_reading_comprehension/owner_passages/rc_passage_10.md"],
  // -- רפורמה 2026 (9) --
  ["lesson.reform.01", "07_new_reform_audio_writing/7.1_reform_overview.md"],
  ["lesson.reform.02", "07_new_reform_audio_writing/7.2_listening_guide.md"],
  ["lesson.reform.03", "07_new_reform_audio_writing/7.3_listening_practice_quizzes.md"],
  ["lesson.reform.04", "07_new_reform_audio_writing/7.4_word_formation_guide.md"],
  // The content owner's word-formation tests: typed answers, 4 per test. (7.5, the
  // multiple-choice practice they replace, stays on disk.)
  ["lesson.reform.wf-01", "07_new_reform_audio_writing/owner_wf/wf_test_01.md"],
  ["lesson.reform.wf-02", "07_new_reform_audio_writing/owner_wf/wf_test_02.md"],
  ["lesson.reform.wf-03", "07_new_reform_audio_writing/owner_wf/wf_test_03.md"],
  ["lesson.reform.wf-04", "07_new_reform_audio_writing/owner_wf/wf_test_04.md"],
  ["lesson.reform.wf-05", "07_new_reform_audio_writing/owner_wf/wf_test_05.md"],
  ["lesson.reform.wf-06", "07_new_reform_audio_writing/owner_wf/wf_test_06.md"],
  ["lesson.reform.wf-07", "07_new_reform_audio_writing/owner_wf/wf_test_07.md"],
  ["lesson.reform.wf-08", "07_new_reform_audio_writing/owner_wf/wf_test_08.md"],
  ["lesson.reform.wf-09", "07_new_reform_audio_writing/owner_wf/wf_test_09.md"],
  ["lesson.reform.wf-10", "07_new_reform_audio_writing/owner_wf/wf_test_10.md"],
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
    { id: "lesson.vocab.17", title: "פעלים מורכבים (Phrasal Verbs)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.vocab.18", title: "מילות קישור (מתקדמים)", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.vocab.19", title: "רמת שליטה מלאה", kind: "text", estimatedMinutes: 25 },
    { id: "lesson.vocab.20", title: "דוגמה: חבילה 100 מילים", kind: "text", estimatedMinutes: 20 },
  ],
  practiceSets: [{ id: "pr-vocab-1", title: "מילים בשכיחות גבוהה", questionIds: takeQuestionIds("vocabulary", 10) }],
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
    Q("quiz-vocab", "תרגול אוצר מילים", ["vocabulary"]),
    Q("quiz-vocab-2", "אוצר מילים והשלמת משפטים", ["vocabulary", "sentence_completion"]),
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
      title: "מדריך השיטות המלא (4.2)",
      kind: "text",
      estimatedMinutes: 40,
      videoSlot: true,
      practiceSetId: "pr-sc-mid",
      quizId: "quiz-sc",
    },
    { id: "lesson.sc.02", title: "4.3 - מלכודות נפוצות", kind: "text", estimatedMinutes: 25, quizId: "quiz-sc-2" },
    { id: "lesson.sc.03", title: "סרטון הדרכה - 5 שיטות (תסריט / וידאו)", kind: "video", estimatedMinutes: 15 },
    { id: "lesson.sc.test-01", title: "מבחן תרגול 1 (קל)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-02", title: "מבחן תרגול 2 (קל-בינוני)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-03", title: "מבחן תרגול 3 (בינוני)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-04", title: "מבחן תרגול 4 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-05", title: "מבחן תרגול 5 (קשה מאוד)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-06", title: "מבחן תרגול 6 (בינוני-קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-07", title: "מבחן תרגול 7 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-08", title: "מבחן תרגול 8 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-09", title: "מבחן תרגול 9 (קשה מאוד)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-10", title: "מבחן תרגול 10 (הקשה ביותר)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-11", title: "מבחן תרגול 11 (בינוני-קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-12", title: "מבחן תרגול 12 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-13", title: "מבחן תרגול 13 (קשה מאוד)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.sc.test-14", title: "מבחן תרגול 14 (הקשה ביותר)", kind: "text", estimatedMinutes: 10 },
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
  quizzes: [Q("quiz-sc", "תרגול השלמת משפטים", ["sentence_completion"]), Q("quiz-sc-2", "השלמת משפטים ואוצר מילים", ["sentence_completion", "vocabulary"])],
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
    { id: "lesson.rephrase.set-01", title: "מקבץ תרגול 1 (קל)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-02", title: "מקבץ תרגול 2 (קל)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-03", title: "מקבץ תרגול 3 (קל-בינוני)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-04", title: "מקבץ תרגול 4 (בינוני)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-05", title: "מקבץ תרגול 5 (בינוני)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-06", title: "מקבץ תרגול 6 (בינוני-קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-07", title: "מקבץ תרגול 7 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-08", title: "מקבץ תרגול 8 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-09", title: "מקבץ תרגול 9 (קשה מאוד)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-10", title: "מקבץ תרגול 10 (הקשה ביותר)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-11", title: "מקבץ תרגול 11 (בינוני-קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-12", title: "מקבץ תרגול 12 (קשה)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-13", title: "מקבץ תרגול 13 (קשה מאוד)", kind: "text", estimatedMinutes: 10 },
    { id: "lesson.rephrase.set-14", title: "מקבץ תרגול 14 (הקשה ביותר)", kind: "text", estimatedMinutes: 10 },
  ],
  practiceSets: [{ id: "pr-rephrase", title: "סט ניסוח מחדש", questionIds: takeQuestionIds("rephrasing", 10) }],
  quizzes: [Q("quiz-rephrase", "תרגול ניסוח מחדש", ["rephrasing"]), Q("quiz-rephrase-2", "ניסוח מחדש והבנת הנקרא", ["rephrasing", "reading_comprehension"])],
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
    { id: "lesson.reading.passage-01", title: "קטע קריאה 1 (קל)", kind: "text", estimatedMinutes: 17 },
    { id: "lesson.reading.passage-02", title: "קטע קריאה 2 (קל-בינוני)", kind: "text", estimatedMinutes: 17 },
    { id: "lesson.reading.passage-03", title: "קטע קריאה 3 (קל-בינוני)", kind: "text", estimatedMinutes: 17 },
    { id: "lesson.reading.passage-04", title: "קטע קריאה 4 (בינוני)", kind: "text", estimatedMinutes: 17 },
    { id: "lesson.reading.passage-05", title: "קטע קריאה 5 (בינוני)", kind: "text", estimatedMinutes: 17 },
    { id: "lesson.reading.passage-06", title: "קטע קריאה 6 (קשה)", kind: "text", estimatedMinutes: 17 },
    { id: "lesson.reading.passage-07", title: "קטע קריאה 7 (קשה)", kind: "text", estimatedMinutes: 20 },
    { id: "lesson.reading.passage-08", title: "קטע קריאה 8 (קשה מאוד)", kind: "text", estimatedMinutes: 20 },
    { id: "lesson.reading.passage-09", title: "קטע קריאה 9 (קשה מאוד)", kind: "text", estimatedMinutes: 20 },
    { id: "lesson.reading.passage-10", title: "קטע קריאה 10 (הקשה ביותר)", kind: "text", estimatedMinutes: 20 },
  ],
  practiceSets: [{ id: "pr-reading", title: "סט הבנת הנקרא", questionIds: takeQuestionIds("reading_comprehension", 10) }],
  quizzes: [Q("quiz-reading", "תרגול הבנת הנקרא", ["reading_comprehension"]), Q("quiz-reading-2", "הבנת הנקרא וניסוח מחדש", ["reading_comprehension", "rephrasing"])],
};

const REF: ManifestModule = {
  id: "mod-reform",
  slug: "new-exam-format-2026",
  title: "רפורמה 2026",
  sortOrder: 5,
  lessons: [
    { id: "lesson.reform.01", title: "רפורמה - סקירה (7.1)", kind: "mixed", estimatedMinutes: 30, videoSlot: true, practiceSetId: "pr-reform", quizId: "quiz-reform" },
    { id: "lesson.reform.02", title: "הבנת הנשמע (7.2)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.03", title: "מבחני שמיעה (7.3)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.04", title: "תצורת מילים (7.4)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.wf-01", title: "מבחן יצירת מילה 1", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-02", title: "מבחן יצירת מילה 2", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-03", title: "מבחן יצירת מילה 3", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-04", title: "מבחן יצירת מילה 4", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-05", title: "מבחן יצירת מילה 5", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-06", title: "מבחן יצירת מילה 6", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-07", title: "מבחן יצירת מילה 7", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-08", title: "מבחן יצירת מילה 8", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-09", title: "מבחן יצירת מילה 9", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.wf-10", title: "מבחן יצירת מילה 10", kind: "text", estimatedMinutes: 5 },
    { id: "lesson.reform.06", title: "דקדוק בהקשר (7.6)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.07", title: "תרגול grammar (7.7)", kind: "text", estimatedMinutes: 30 },
    { id: "lesson.reform.08", title: "כתיבה (7.8)", kind: "text", estimatedMinutes: 35, quizId: "quiz-reform-2" },
    { id: "lesson.reform.09", title: "דוגמאות וכתיבה (7.9)", kind: "text", estimatedMinutes: 30 },
  ],
  practiceSets: [
    { id: "pr-reform", title: "תרגול משולב", questionIds: [...takeQuestionIds("vocabulary", 4), ...takeQuestionIds("sentence_completion", 4)] },
  ],
  quizzes: [
    Q("quiz-reform", "תרגול משולב (רפורמת 2026)", ["vocabulary", "sentence_completion", "rephrasing"]),
    Q("quiz-reform-2", "תרגול כל הנושאים", ["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"]),
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
    { id: "lesson.sim.04", title: "סימולציה 1 - מדידת פתיחה", kind: "text", estimatedMinutes: 45, videoSlot: true },
    { id: "lesson.sim.05", title: "סימולציה 2 - חימום", kind: "text", estimatedMinutes: 45, videoSlot: true },
    { id: "lesson.sim.06", title: "סימולציה 3 - אתגר", kind: "text", estimatedMinutes: 45, videoSlot: true },
    { id: "lesson.sim.07", title: "סימולציה 4 - תנאי אמת", kind: "text", estimatedMinutes: 45, videoSlot: true },
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
  practiceSets: [{ id: "pr-tips", title: "תרגול מהיר משולב", questionIds: takeQuestionIds("sentence_completion", 8) }],
  quizzes: [Q("quiz-tips", "בדיקת אסטרטגיות", ["sentence_completion", "reading_comprehension"])],
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
  quizzes: [Q("quiz-final", "חזרה מסכמת", ["vocabulary", "sentence_completion", "rephrasing", "reading_comprehension"])],
};

/** מודולי תוכן שמקורם ב־NAVIGATION / תיקיית `content/amirnet-course` (ללא מבוא). */
export const AMIRNET_CONTENT_MODULES: ManifestModule[] = [VOCAB, SENT, REPH, READ, REF, SIM, TIP, SUM];
