import { z } from "zod";

/**
 * API contract for `POST /api/prep/amirant-course/ai-analysis`.
 * The server only echoes **client-supplied** stats and lesson snippets - it never
 * invents exam scores, percentages, or "official" Amirant results.
 *
 * TODO(future-llm): Add optional `openai: { model, messages, temperature: 0 }` when wiring
 * OpenAI - keep a separate code path that **rejects** any response containing numeric
 * claims not present in `stats` (post-filter or structured JSON output with Zod).
 */

export const aiAnalysisByTopicEntrySchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const aiAnalysisSessionEntrySchema = z.object({
  at: z.string(),
  kind: z.string(),
  label: z.string(),
  scorePct: z.number().optional(),
});

/**
 * All numeric fields are **user-provided analytics snapshots**; the model must not be trusted
 * to add new numbers - pass only what you already store in `localStorage` or DB.
 */
export const aiAnalysisStatsPayloadSchema = z.object({
  weakTopics: z.array(z.string()).optional(),
  strongTopics: z.array(z.string()).optional(),
  byTopic: z.record(z.string(), aiAnalysisByTopicEntrySchema).optional(),
  sessionsSample: z.array(aiAnalysisSessionEntrySchema).optional(),
  improvementHint: z.string().optional(),
});

export const aiAnalysisLessonSnippetSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  moduleTitle: z.string(),
  snippet: z.string(),
});

/**
 * Input body - deterministic handler ignores unknown keys; Zod is used to validate shape only.
 */
export const aiAnalysisRequestSchema = z.object({
  kind: z.string().optional(),
  stats: aiAnalysisStatsPayloadSchema.optional(),
  lessonSnippets: z.array(aiAnalysisLessonSnippetSchema).optional(),
});

export type AiAnalysisRequest = z.infer<typeof aiAnalysisRequestSchema>;

/**
 * **Never** add fields like `generatedScore` or `predictedExamResult` here without a
 * grounded source in the request payload.
 */
export const aiAnalysisResponseSchema = z.object({
  text: z.string(),
  source: z.enum(["deterministic", "openai"]),
  model: z.string(),
});

export type AiAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;

export function buildDeterministicAnalysisText(input: {
  weakTopics: string[];
  strongTopics: string[];
  byTopic: Record<string, { correct: number; total: number }>;
  improvementHint: string;
  lessonLines: string[];
}): string {
  const weak = input.weakTopics.join(", ") || "(אין)";
  const strong = input.strongTopics.join(", ") || "(אין)";
  const topics = Object.entries(input.byTopic)
    .map(([k, v]) => `${k}: ${v.correct}/${v.total}`)
    .join(" · ");
  return [
    "ניתוח מבוסס נתונים בלבד (לא נוספו עובדות שלא הוזנו):",
    "",
    `נושאים לחיזוק (לפי רשימת החולשות שסופקה): ${weak}`,
    `נושאים חזקים: ${strong}`,
    `מגמה: ${input.improvementHint || "(לא סופק)"}`,
    topics ? `סיכום ניסיון לפי נושא: ${topics}` : "אין עדיין סיכום ניסיון לפי נושא.",
    "",
    "קטעים מהשיעורים שסופקו לצורך הקשר:",
    input.lessonLines.length ? input.lessonLines.join("\n") : "(לא סופקו שיעורים)",
    "",
    "המלצות לימוד (כלליות, בהתאם לנתונים בלבד):",
    "- לחזור על שיעורי המודולים שבהם מופיעים הנושאים החלשים.",
    "- להריץ מבחן אדפטיבי נוסף אחרי תרגול ממוקד.",
    "- לעקוב אחרי זמן תשובה ממוצע אם גבוה - לתרגל קצב.",
  ].join("\n");
}
