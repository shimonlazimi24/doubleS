import type { LessonChatActiveContext } from "../schemas";
import type { LessonChatActiveContextForPrompt } from "../prompts";
import type { AiQuizSnapshot, AiUserStatsSnapshot } from "../retrieval";
import { AMIRANT_TOPIC_LABEL_HE } from "../../topic-labels";
import type { AmirantBankTopicSlug } from "../../types/bank-question";

export type AnswerKeyLookup = (questionId: string) => { correctOptionId: string; explanation?: string } | undefined;

/**
 * Decides whether the model may see the answer key.
 * Timed unit (quiz / placement / simulation) and the learner has not answered: never.
 * Otherwise the key is attached when the bank has it. The browser never sends keys.
 */
export function resolveActiveContextForPrompt(
  ctx: LessonChatActiveContext | undefined,
  lookupKey: AnswerKeyLookup,
  /**
   * Staged hints (stages 1-3) never carry the key, even on untimed practice where
   * it would otherwise be allowed: a model that can see "correct = (a)" lets it slip
   * into a hint.
   */
  options: { staged?: boolean } = {},
): LessonChatActiveContextForPrompt | undefined {
  if (!ctx) return undefined;
  const base: LessonChatActiveContextForPrompt = {
    kind: ctx.kind,
    text: ctx.text,
    stepLabel: ctx.stepLabel,
    questionType: ctx.questionType,
    options: ctx.options,
    passageText: ctx.passageText,
    timed: ctx.timed,
    answered: ctx.answered,
    selectedOptionId: ctx.selectedOptionId,
  };
  if (ctx.kind !== "quiz_question" || !ctx.questionId || options.staged) return base;
  const keyAllowed = !ctx.timed || ctx.answered === true;
  if (!keyAllowed) return base;
  const key = lookupKey(ctx.questionId);
  return key ? { ...base, answerKey: key } : base;
}

/** The learner wants the key for a timed question they have not answered yet. */
export function isRevealBlocked(ctx: LessonChatActiveContext | undefined): boolean {
  return ctx?.kind === "quiz_question" && ctx.timed === true && ctx.answered !== true;
}

/**
 * Whether the staged-hint prompt (one clue per stage, never the answer) applies.
 *
 * It belongs to an unanswered question on screen. An explicit hint request keeps it
 * even without one. Everywhere else it would be wrong: a strategy question with no
 * question on screen was being cut down to a single stage-1 clue, and an answered
 * question got "never give the answer" layered over "use the key" - the model then
 * refused to explain the learner's own mistake.
 */
export function shouldUseStagedHelp(params: {
  intent: string;
  wantsReveal: boolean;
  active: LessonChatActiveContext | undefined;
}): boolean {
  if (params.wantsReveal) return false;
  if (params.intent === "staged_hint") return true;
  if (params.intent !== "question_help") return false;
  return params.active?.kind === "quiz_question" && params.active.answered !== true;
}

export const REVEAL_BLOCKED_ANSWER_HE =
  "זו שאלה במבחן מתוזמן, ועדיין לא סימנתם תשובה - אז את הפתרון אני שומר. בחרו את התשובה שנראית לכם נכונה, ומיד אחרי זה אסביר במלואו למה היא נכונה או לא. אם תרצו, אפשר לבקש רמז בינתיים.";

function labelTopic(slug: string): string {
  return AMIRANT_TOPIC_LABEL_HE[slug as AmirantBankTopicSlug] ?? slug;
}

/**
 * One compact line about the learner for the prompt. Numbers here are the only learner
 * figures the model may repeat (the numeric-claims validator allows them).
 */
export function buildLearnerProfileText(
  userStats: AiUserStatsSnapshot,
  quiz: AiQuizSnapshot | null,
  signedIn: boolean,
): string {
  if (!signedIn) return "guest - no history.";
  const parts: string[] = [];
  const weakFromQuiz = quiz?.weakTopics?.map(labelTopic) ?? [];
  if (weakFromQuiz.length) parts.push(`weak topics in last quiz: ${weakFromQuiz.join(", ")}`);
  if (quiz?.scorePct != null) parts.push(`last quiz ${Math.round(quiz.scorePct)}% (${quiz.correctCount}/${quiz.questionCount})`);
  const rollups = userStats.topicRollups
    .filter((r) => r.totalAnswered >= 3)
    .map((r) => ({ topic: labelTopic(r.topic), pct: Math.round((100 * r.totalCorrect) / Math.max(1, r.totalAnswered)), n: r.totalAnswered }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);
  if (rollups.length) {
    parts.push(`practice accuracy: ${rollups.map((r) => `${r.topic} ${r.pct}% (n=${r.n})`).join(", ")}`);
  }
  return parts.length ? parts.join("; ") + "." : "signed in - no quiz history yet.";
}
