import { z } from "zod";

/**
 * What the lesson editor may write to `cms_lessons`.
 *
 * The routes used to spread the request body into the row, so a typo'd module,
 * a negative duration or an `http://` video all reached Postgres, and the admin
 * saw its English error. Only manifest lessons are accepted: the lesson page
 * looks the id up in the course manifest first and 404s when it is missing, so
 * a row for any other id is content no learner can ever open.
 */

export const LESSON_KINDS = ["text", "video", "mixed"] as const;

const httpsOrEmpty = z
  .string()
  .trim()
  .max(500, "הכתובת ארוכה מדי")
  .refine((v) => v === "" || /^https:\/\/\S+$/i.test(v), "קישור הסרטון חייב להתחיל ב-https://");

const lessonFieldsSchema = z.object({
  title: z.string({ error: "חסרה כותרת לשיעור" }).trim().min(1, "חסרה כותרת לשיעור").max(200, "הכותרת ארוכה מדי"),
  kind: z.enum(LESSON_KINDS, { error: "סוג שיעור לא מוכר" }).default("text"),
  module_id: z.string().trim().default(""),
  body_markdown: z.string().max(200_000, "התוכן ארוך מדי").default(""),
  video_url: httpsOrEmpty.default(""),
  estimated_minutes: z.coerce
    .number()
    .int("זמן משוער חייב להיות מספר שלם")
    .min(1, "זמן משוער: לפחות דקה")
    .max(600, "זמן משוער: עד 600 דקות")
    .default(10),
  sort_order: z.coerce.number().int("סדר תצוגה חייב להיות מספר שלם").min(0, "סדר תצוגה: 0 ומעלה").max(10_000).default(0),
  published: z.boolean({ error: "ערך פרסום לא תקין" }).default(false),
});

export type LessonRow = {
  id: string;
  title: string;
  kind: (typeof LESSON_KINDS)[number];
  module_id: string | null;
  body_markdown: string;
  video_url: string | null;
  estimated_minutes: number;
  sort_order: number;
  published: boolean;
};

export type LessonPayloadResult = { ok: true; row: LessonRow } | { ok: false; error: string };

export function parseLessonPayload(
  id: string,
  body: unknown,
  known: { lessonIds: ReadonlySet<string>; moduleIds: ReadonlySet<string> },
): LessonPayloadResult {
  const cleanId = id.trim();
  if (!known.lessonIds.has(cleanId)) {
    return { ok: false, error: "המזהה לא קיים בקורס. אפשר לערוך רק שיעורים שקיימים בקבצי הקורס." };
  }
  const parsed = lessonFieldsSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }
  const p = parsed.data;
  if (p.module_id && !known.moduleIds.has(p.module_id)) {
    return { ok: false, error: "המודול שנבחר לא קיים בקורס" };
  }
  if (p.kind !== "text" && !p.video_url) {
    return { ok: false, error: "לשיעור עם סרטון צריך קישור לסרטון" };
  }
  return {
    ok: true,
    row: {
      id: cleanId,
      title: p.title,
      kind: p.kind,
      module_id: p.module_id || null,
      body_markdown: p.body_markdown,
      video_url: p.video_url || null,
      estimated_minutes: p.estimated_minutes,
      sort_order: p.sort_order,
      published: p.published,
    },
  };
}
