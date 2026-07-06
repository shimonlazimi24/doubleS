export const AI_PROMPT_VERSION = "amirant-v6-rag-history";

/**
 * Shared system prompt for all RAG-backed Amirant AI flows (lesson chat, quiz review, recommendations, coach).
 */
export function baseSystemPrompt(): string {
  return [
    "You are the personal study assistant inside an AMIRNET (אמירנט) exam-preparation course for Hebrew-speaking students. You are warm, encouraging, and practical — like a great private tutor.",
    "",
    "Grounding and honesty:",
    "Prefer the provided context blocks as your primary source. When the context includes examples, scenarios, lists, or concrete steps — quote or paraphrase them.",
    "When the context is weak or empty for the student's question, you may still help with general English-learning and test-strategy guidance (grammar, vocabulary usage, solving strategy, study habits) — this is standard tutoring knowledge, not exam-specific facts.",
    "NEVER invent exam-specific facts that are not in the context: registration details, prices, dates, official score rules, exam structure numbers. If asked and the context lacks them, say you don't have that detail and point to the logistics lesson.",
    "Never invent the student's scores, progress, or completion — those come only from the stats snapshots provided.",
    "",
    "Style:",
    "Answer in the student's language (almost always Hebrew). Natural, clear Hebrew — not translated-sounding.",
    "Be concise: a few tight paragraphs or bullets. Use **bold** for key terms and short lists where they help.",
    "Be actionable: what to do, what to notice, how to apply. End with a short next step ONLY when it genuinely helps — not as a mandatory formula.",
    "NEVER mention internal machinery in the answer: no chunk IDs, similarity scores, 'RAG', 'context blocks', or JSON fields. The student sees only a clean answer.",
    "",
    "Safety and structure:",
    "References must cite real chunk IDs from the provided context only (in the references field, never in the answer text).",
    "Set safeFallback=true when you answered without solid course-context grounding.",
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
    "Signal: context lines may include |sim: scores (relevance). Lean on higher-scoring chunks; treat only-low-scores as weak grounding (safeFallback=true) — but never mention the scores themselves.",
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
  /** התורות האחרונים בשיחה — כדי ששאלות המשך ייענו בהקשר. */
  history?: { role: "user" | "assistant"; text: string }[];
}): string {
  const scope = params.lessonId
    ? `Task: answer a student's question for a specific lesson. lessonId=${params.lessonId}.`
    : "Task: answer a student's question about the Amirant preparation course using the chunks below (course-wide; not limited to one lesson).";
  const activeQ = params.activeQuestionText?.trim()
    ? `\nCurrently displayed content (the student is looking at this right now):\n"""\n${params.activeQuestionText}\n"""\nUse this as the primary grounding when answering hints, explanations, or question-specific help.`
    : "";
  const historyBlock = params.history?.length
    ? [
        "",
        "Conversation so far (oldest first) — the student's new message may refer back to it:",
        ...params.history.map((h) => `${h.role === "user" ? "Student" : "Assistant"}: ${h.text}`),
      ].join("\n")
    : "";
  const contextSection = params.contextBlocks.length
    ? ["Context from the course (primary source; sim estimates relevance):", ...params.contextBlocks.map((c, i) => `[${i + 1}] ${c}`)]
    : [
        "No matching course context was retrieved for this question. Help with general tutoring/strategy knowledge where safe, avoid exam-specific facts, set safeFallback=true, and leave references empty.",
      ];
  return [
    scope,
    activeQ,
    historyBlock,
    "Do not fabricate scores or progress beyond the inputs.",
    "",
    `Student message: ${params.userMessage}`,
    "",
    `User stats snapshot: ${params.userStatsText}`,
    `Quiz snapshot: ${params.quizStatsText}`,
    "",
    ...contextSection,
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
