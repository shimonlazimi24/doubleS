export const AI_PROMPT_VERSION = "amirant-v5-rag";

/**
 * Shared system prompt for all RAG-backed Amirant AI flows (lesson chat, quiz review, recommendations, coach).
 */
export function baseSystemPrompt(): string {
  return [
    "You are an Amirant study assistant. Your job is to help the student using the course material, not generic tutoring.",
    "",
    "Grounding and honesty:",
    "Answer ONLY using the provided context blocks. Do not use outside knowledge, material not in context, or assumptions about the exam.",
    "Use examples from the course: when the context includes examples, scenarios, lists, or concrete steps, lean on them — quote or paraphrase them in the answer when useful.",
    "Avoid generic explanations: do not default to broad textbook-style answers that could apply to any course. Tie the answer to what appears in the context blocks.",
    "If the context is weak, sparse, or a poor match, say so clearly in the answer (e.g. low |sim: scores, few chunks, or no relevant example). Set safeFallback=true. Do not invent details, sources, or examples to fill gaps — no hallucination.",
    "Context lines may include |sim:0.000–1.000 (higher = closer to the query). Use this as a signal for confidence: many low scores or very little text means you should be explicit that grounding is limited.",
    "",
    "Style:",
    "Be short and clear. Prefer a few tight paragraphs or bullets over long essays.",
    "Prefer actionable, practical explanations (what to do, what to notice, how to apply) over abstract theory. Only go theoretical when the context itself is theoretical.",
    "Prefer concise Hebrew-friendly phrasing when the student writes in Hebrew; otherwise match the student's language.",
    "",
    "Safety and structure:",
    "Never invent official score, correctness, progress, or completion. Business truth is database truth only.",
    "Only explain, summarize, and recommend — from context and allowed stats in the user message.",
    "References must cite real chunk IDs from the provided context only.",
    "If the context does not support a reliable answer, set safeFallback=true, say what is missing, and do not guess.",
  ].join("\n");
}

export type AmirantRagEndpoint =
  | "lesson_chat"
  | "quiz_review"
  | "recommendations"
  | "coach_summary";

/** Unchanged RAG base rules + compact per-endpoint + output/tone. Keeps base rules in `baseSystemPrompt` only. */
export function amirantRagSystemPrompt(endpoint: AmirantRagEndpoint): string {
  const mode: Record<AmirantRagEndpoint, string> = {
    lesson_chat:
      "Mode: explain with examples from the context; avoid generic explanations not tied to those chunks.",
    quiz_review:
      "Mode: focus on mistake patterns; use context + wrong IDs to explain why those answers fail.",
    recommendations:
      "Mode: give 2–3 concrete steps aimed at weak topics from the task; do not center the plan on strong topics.",
    coach_summary:
      "Mode: short progress summary; highlight the main areas to improve next, grounded in snapshots and context.",
  };
  return [
    baseSystemPrompt(),
    mode[endpoint],
    "Signal: lean on higher-|sim: chunks. If *only* low-|sim: lines, treat as weak context and follow base safeFallback; do not pretend grounding is strong.",
    "Style layer: clear, short, like a helpful peer — not academic tone.",
    'Action line: end the `answer` string with a line "מה לעשות עכשיו" then 1–2 brief steps (only from context + the stats fields in the user message; if impossible, one honest next step per base rules).',
  ].join("\n");
}

export function lessonChatPrompt(params: {
  userMessage: string;
  /** כש־`undefined` — שאלת תלמיד ברמת \"כל הקורס\" (הקשר מהצ׳אט הגלובלי). */
  lessonId: string | undefined;
  contextBlocks: string[];
  userStatsText: string;
  quizStatsText: string;
  /** Plain text of the step/question currently on screen — use this as the primary grounding when answering. */
  activeQuestionText?: string;
}): string {
  const scope = params.lessonId
    ? `Task: answer a student's question for a specific lesson. lessonId=${params.lessonId}.`
    : "Task: answer a student's question about the Amirant preparation course using the chunks below (course-wide; not limited to one lesson).";
  const activeQ = params.activeQuestionText?.trim()
    ? `\nCurrently displayed content (the student is looking at this right now):\n"""\n${params.activeQuestionText}\n"""\nUse this as the primary grounding when answering hints, explanations, or question-specific help.`
    : "";
  return [
    scope,
    activeQ,
    "Answer ONLY from the context blocks. Ground strictly in the provided course/lesson context.",
    "If context is missing, say so and ask student to open a relevant lesson or rephrase.",
    "Do not fabricate scores or progress beyond the inputs.",
    "Always cite chunk IDs in references.",
    "",
    `Student message: ${params.userMessage}`,
    "",
    `User stats snapshot: ${params.userStatsText}`,
    `Quiz snapshot: ${params.quizStatsText}`,
    "",
    "Context (answer ONLY using these; sim estimates relevance):",
    ...params.contextBlocks.map((c, i) => `[${i + 1}] ${c}`),
  ].join("\n");
}

export function quizReviewPrompt(params: {
  weakTopics: string[];
  wrongQuestionIds: string[];
  contextBlocks: string[];
  userStatsText: string;
  quizStatsText: string;
}): string {
  return [
    "Task: produce a focused quiz review. Answer ONLY using the context blocks below.",
    `Weak topics: ${params.weakTopics.join(", ") || "none"}.`,
    `Wrong question IDs: ${params.wrongQuestionIds.join(", ") || "none"}.`,
    "Provide: summary + actionable steps.",
    "Never invent score values.",
    "Always cite chunk IDs in references.",
    "",
    `User stats snapshot: ${params.userStatsText}`,
    `Quiz snapshot: ${params.quizStatsText}`,
    "",
    "Context (answer ONLY using these):",
    ...params.contextBlocks.map((c, i) => `[${i + 1}] ${c}`),
  ].join("\n");
}

export function recommendationsPrompt(params: {
  weakTopics: string[];
  strongTopics: string[];
  improvementHint: string;
  contextBlocks: string[];
  userStatsText: string;
  quizStatsText: string;
}): string {
  return [
    "Task: produce study recommendations and weekly plan. Answer ONLY using the context blocks below.",
    `Weak topics: ${params.weakTopics.join(", ") || "none"}.`,
    `Strong topics: ${params.strongTopics.join(", ") || "none"}.`,
    `Trend hint: ${params.improvementHint || "none"}.`,
    "Prioritize weak areas while preserving strengths.",
    "Never invent progress metrics beyond input.",
    "Always cite chunk IDs in references.",
    "",
    `User stats snapshot: ${params.userStatsText}`,
    `Quiz snapshot: ${params.quizStatsText}`,
    "",
    "Context (answer ONLY using these):",
    ...params.contextBlocks.map((c, i) => `[${i + 1}] ${c}`),
  ].join("\n");
}

export function coachSummaryPrompt(params: {
  weakTopics: string[];
  strongTopics: string[];
  latestScorePct?: number;
  sessionsCount: number;
  contextBlocks: string[];
  userStatsText: string;
  quizStatsText: string;
}): string {
  return [
    "Task: write a dashboard coach summary. Answer ONLY using the context blocks below.",
    `Weak topics: ${params.weakTopics.join(", ") || "none"}.`,
    `Strong topics: ${params.strongTopics.join(", ") || "none"}.`,
    `Latest score: ${params.latestScorePct != null ? `${params.latestScorePct}%` : "unknown"}.`,
    `Sessions count: ${params.sessionsCount}.`,
    "Tone: practical, concise, motivational.",
    "Never fabricate score history.",
    "Always cite chunk IDs in references.",
    "",
    `User stats snapshot: ${params.userStatsText}`,
    `Quiz snapshot: ${params.quizStatsText}`,
    "",
    "Context (answer ONLY using these):",
    ...params.contextBlocks.map((c, i) => `[${i + 1}] ${c}`),
  ].join("\n");
}
