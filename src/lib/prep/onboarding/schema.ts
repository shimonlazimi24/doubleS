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
  over_6h: "יותר מ-6",
  unknown: "עדיין לא יודע/ת",
};

export const FIRST_TIME_OPTIONS = ["yes", "no", "other"] as const;

export const FIRST_TIME_LABELS: Record<(typeof FIRST_TIME_OPTIONS)[number], string> = {
  yes: "כן",
  no: "לא",
  other: "אחר",
};

export const onboardingPayloadSchema = z
  .object({
    sortingExamDate: z.string().nullable(),
    sortingExamDateUnknown: z.boolean(),
    institutionName: z.string().min(1),
    fieldOfStudy: z.string().min(1),
    firstTimeExam: z.enum(FIRST_TIME_OPTIONS),
    firstTimeExamOther: z.string().nullable(),
    dailyStudyTime: z.enum(DAILY_STUDY_OPTIONS),
    dailyStudyTimeOther: z.string().nullable(),
    /** בחירה יחידה ב-UI; נשמר כמערך לתאימות עם `heard_about text[]` בבסיס הנתונים. */
    heardAbout: z.array(z.enum(HEARD_ABOUT_OPTIONS)).min(1),
    heardAboutOther: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.sortingExamDateUnknown && !data.sortingExamDate) {
      ctx.addIssue({ code: "custom", message: "נא לבחור תאריך או «עדיין לא נקבע»", path: ["sortingExamDate"] });
    }
    if (data.firstTimeExam === "other" && !data.firstTimeExamOther?.trim()) {
      ctx.addIssue({ code: "custom", message: "נא לפרט", path: ["firstTimeExamOther"] });
    }
    if (data.heardAbout.includes("other") && !data.heardAboutOther?.trim()) {
      ctx.addIssue({ code: "custom", message: "נא לפרט", path: ["heardAboutOther"] });
    }
  });

export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
