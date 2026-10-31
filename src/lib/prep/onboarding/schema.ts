import { z } from "zod";

/** סדר התצוגה = סדר המפרט: חיפוש, המלצה, לקוח חוזר, פייסבוק, אינסטגרם, טיקטוק, ChatGPT, אחר. */
export const HEARD_ABOUT_OPTIONS = [
  "internet",
  "recommendation",
  "returning",
  "facebook",
  "instagram",
  "tiktok",
  "chatgpt",
  "other",
] as const;

export const HEARD_ABOUT_LABELS: Record<(typeof HEARD_ABOUT_OPTIONS)[number], string> = {
  internet: "חיפוש באינטרנט",
  recommendation: "המלצה (משפחה או חברים)",
  returning: "לקוח/ה חוזר/ת",
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  tiktok: "טיקטוק",
  chatgpt: "ChatGPT",
  other: "אחר",
};

export const DAILY_STUDY_OPTIONS = [
  "under_1h",
  "1_3h",
  "3_6h",
  "over_6h",
  "unknown",
] as const;

export const DAILY_STUDY_LABELS: Record<(typeof DAILY_STUDY_OPTIONS)[number], string> = {
  under_1h: "פחות משעה",
  "1_3h": "1-3 שעות",
  "3_6h": "3-6 שעות",
  over_6h: "יותר מ-6 שעות",
  unknown: "עוד לא יודע/ת",
};

export const FIRST_TIME_OPTIONS = ["yes", "no", "other"] as const;

export const FIRST_TIME_LABELS: Record<(typeof FIRST_TIME_OPTIONS)[number], string> = {
  yes: "כן, פעם ראשונה",
  no: "לא, נבחנתי בעבר",
  other: "אחר",
};

/** How far ahead an exam date may be. Dates past this are typos (2062 for 2026). */
const MAX_EXAM_DAYS_AHEAD = 3 * 365;

/** Local calendar day as YYYY-MM-DD, for `<input type="date" min>`. */
export function isoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Checks an exam date from the form. Returns a Hebrew error, or null when fine.
 *
 * The column is a Postgres `date`, and the API used to pass any string through:
 * a malformed value became a 500 with Postgres' English message on the
 * learner's screen, and a date in the past was accepted, after which the course
 * home told the learner their exam "already passed".
 *
 * One day of slack on the past side: the server may be a timezone behind Israel.
 */
export function examDateError(iso: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "תאריך לא תקין";
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return "תאריך לא תקין";
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12);
  const days = Math.round((date.getTime() - today) / 86_400_000);
  if (days < -1) return "התאריך כבר עבר. בחרו תאריך עתידי או «עוד לא נקבע».";
  if (days > MAX_EXAM_DAYS_AHEAD) return "התאריך רחוק מדי. בדקו את השנה.";
  return null;
}

export const onboardingPayloadSchema = z
  .object({
    sortingExamDate: z.string().nullable(),
    sortingExamDateUnknown: z.boolean(),
    /** Optional CRM fields — wizard focuses on 3 learner questions. */
    institutionName: z.string().default("לא צוין"),
    fieldOfStudy: z.string().default("לא צוין"),
    firstTimeExam: z.enum(FIRST_TIME_OPTIONS, { error: "בחרו אם זו הפעם הראשונה" }),
    firstTimeExamOther: z.string().max(200, "הטקסט ארוך מדי").nullable(),
    dailyStudyTime: z.enum(DAILY_STUDY_OPTIONS, { error: "בחרו זמן לימוד יומי" }),
    dailyStudyTimeOther: z.string().nullable(),
    heardAbout: z.array(z.enum(HEARD_ABOUT_OPTIONS)).default([]),
    heardAboutOther: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.sortingExamDateUnknown) {
      if (!data.sortingExamDate) {
        ctx.addIssue({ code: "custom", message: "בחרו תאריך או «עוד לא נקבע»", path: ["sortingExamDate"] });
      } else {
        const dateError = examDateError(data.sortingExamDate);
        if (dateError) ctx.addIssue({ code: "custom", message: dateError, path: ["sortingExamDate"] });
      }
    }
    if (data.firstTimeExam === "other" && !data.firstTimeExamOther?.trim()) {
      ctx.addIssue({ code: "custom", message: "כתבו במילה או שתיים מה המצב", path: ["firstTimeExamOther"] });
    }
    if (data.heardAbout.includes("other") && !data.heardAboutOther?.trim()) {
      ctx.addIssue({ code: "custom", message: "נא לפרט", path: ["heardAboutOther"] });
    }
  });

export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
