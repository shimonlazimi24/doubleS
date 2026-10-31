import { z } from "zod";

/**
 * What the (experimental) question editor may write to `cms_questions`.
 * Mirrors the table's own checks so the admin gets a Hebrew sentence instead of
 * a Postgres constraint name.
 */

export const QUESTION_TOPICS = [
  "vocabulary",
  "sentence_completion",
  "rephrasing",
  "reading_comprehension",
] as const;

export const QUESTION_TOPIC_LABELS: Record<(typeof QUESTION_TOPICS)[number], string> = {
  vocabulary: "אוצר מילים",
  sentence_completion: "השלמת משפטים",
  rephrasing: "ניסוח מחדש",
  reading_comprehension: "הבנת הנקרא",
};

const optionSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1, "כל ארבע התשובות חייבות להיות מלאות").max(1000),
});

const questionFieldsSchema = z
  .object({
    topic_slug: z.enum(QUESTION_TOPICS, { error: "נושא לא מוכר" }),
    subtopic_slug: z.string().trim().max(100).default(""),
    prompt: z.string({ error: "חסר נוסח השאלה" }).trim().min(1, "חסר נוסח השאלה").max(5000),
    options: z.array(optionSchema, { error: "חסרות תשובות" }).length(4, "נדרשות בדיוק ארבע תשובות"),
    correct_option_id: z.string({ error: "לא סומנה תשובה נכונה" }).trim().min(1, "לא סומנה תשובה נכונה"),
    explanation: z.string().trim().max(5000).default(""),
    difficulty: z.coerce.number().int().min(1, "רמת קושי בין 1 ל-6").max(6, "רמת קושי בין 1 ל-6").default(3),
    published: z.boolean().default(false),
  })
  .superRefine((q, ctx) => {
    const ids = q.options.map((o) => o.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "מזהי התשובות כפולים", path: ["options"] });
    }
    if (!ids.includes(q.correct_option_id)) {
      ctx.addIssue({ code: "custom", message: "התשובה הנכונה לא נמצאת בין התשובות", path: ["correct_option_id"] });
    }
  });

export type QuestionRow = {
  topic_slug: (typeof QUESTION_TOPICS)[number];
  subtopic_slug: string | null;
  prompt: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  explanation: string | null;
  difficulty: number;
  published: boolean;
};

export type QuestionPayloadResult = { ok: true; row: QuestionRow } | { ok: false; error: string };

/** Ids become URL segments: keep them to a safe slug. */
export const QUESTION_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,79}$/;

export function parseQuestionId(raw: unknown): string | null {
  const id = typeof raw === "string" ? raw.trim() : "";
  return QUESTION_ID_PATTERN.test(id) ? id : null;
}

export function parseQuestionPayload(body: unknown): QuestionPayloadResult {
  const parsed = questionFieldsSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }
  const q = parsed.data;
  return {
    ok: true,
    row: {
      topic_slug: q.topic_slug,
      subtopic_slug: q.subtopic_slug || null,
      prompt: q.prompt,
      options: q.options,
      correct_option_id: q.correct_option_id,
      explanation: q.explanation || null,
      difficulty: q.difficulty,
      published: q.published,
    },
  };
}
