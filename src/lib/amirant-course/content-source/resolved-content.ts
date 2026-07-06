import { z } from "zod";
import { importAmirantCourseContent, mapSourceQuestionsToBank } from "./import";
import { AMIRANT_PRODUCTION_CONTENT_SOURCE } from "./production-source";
import { questionSourceItemSchema, passageSourceItemSchema } from "./schemas";
import type { BankQuestion } from "../types/bank-question";

let cached:
  | ReturnType<typeof importAmirantCourseContent>
  | null
  | undefined;

/** תוצאת הייבוא הגולמית — נשמרת גם כששער הסימולציות נכשל, כדי לא לפרסר פעמיים. */
let cachedImport:
  | ReturnType<typeof importAmirantCourseContent>
  | null
  | undefined;

function getImportedPackage() {
  if (cachedImport !== undefined) return cachedImport;
  try {
    cachedImport = importAmirantCourseContent(AMIRANT_PRODUCTION_CONTENT_SOURCE);
  } catch {
    cachedImport = null;
  }
  return cachedImport;
}

export function getResolvedAmirantProductionContent() {
  if (cached !== undefined) return cached;
  const imported = getImportedPackage();
  if (
    imported &&
    imported.sourceKind === "production" &&
    imported.readiness === "production_ready" &&
    imported.questionBank.length > 0 &&
    Object.keys(imported.lessonRegistry).length > 0 &&
    imported.practiceSets.length > 0 &&
    imported.simulationBlueprints.length > 0
  ) {
    cached = imported;
    return cached;
  }
  cached = null;
  return null;
}

export function getAmirantContentMode(): "production" | "demo" {
  return getResolvedAmirantProductionContent() ? "production" : "demo";
}

let cachedBank: BankQuestion[] | null | undefined;

/**
 * בנק השאלות האמיתי — מנותק משער הסימולציות של `getResolvedAmirantProductionContent`
 * (שנופל כי אין סקשן pilot ב־simulations.json ומפיל את כל הקורס ל־demo). כך
 * המניפסט העברי נשאר demo אבל השאלות בחידונים אמיתיות.
 * משתמש בתוצאת הייבוא שכבר קיימת (parse אחד); ולידציה נפרדת של השאלות רק
 * כ-fallback אם הייבוא המלא נכשל מסיבה שאינה קשורה לשאלות.
 */
export function getResolvedAmirantQuestionBank(): BankQuestion[] | null {
  if (cachedBank !== undefined) return cachedBank;
  const imported = getImportedPackage();
  if (imported?.questionBank?.length) {
    cachedBank = imported.questionBank;
    return cachedBank;
  }
  try {
    const rows = z.array(questionSourceItemSchema).parse(AMIRANT_PRODUCTION_CONTENT_SOURCE.questions);
    cachedBank = rows.length > 0 ? mapSourceQuestionsToBank(rows) : null;
    return cachedBank;
  } catch (e) {
    // eslint-disable-next-line no-console -- מאגר השאלות פגום = תקלת תוכן שחובה לראות
    console.error("[amirant-bank] question source failed validation:", e instanceof Error ? e.message : e);
    cachedBank = null;
    return null;
  }
}

export type AmirantPassage = z.infer<typeof passageSourceItemSchema>;

let cachedPassages: Map<string, AmirantPassage> | undefined;

/**
 * קטעי קריאה (הבנת הנקרא) מתוך חבילת המקור — מפתח לפי passageId.
 * ולידציה פר-שורה: קטע פגום אחד לא מעלים את כל הקטעים (שאלות RC בלי קטע
 * אינן ניתנות למענה) — הוא מדולג עם שגיאה בלוג.
 */
export function getResolvedAmirantPassages(): Map<string, AmirantPassage> {
  if (cachedPassages !== undefined) return cachedPassages;
  const map = new Map<string, AmirantPassage>();
  const rows = Array.isArray(AMIRANT_PRODUCTION_CONTENT_SOURCE.passages)
    ? AMIRANT_PRODUCTION_CONTENT_SOURCE.passages
    : [];
  for (const raw of rows) {
    const parsed = passageSourceItemSchema.safeParse(raw);
    if (parsed.success) {
      map.set(parsed.data.passageId, parsed.data);
    } else {
      // eslint-disable-next-line no-console -- תקלת תוכן שדורשת תיקון בצד הסקריפטים
      console.error("[amirant-passages] invalid passage row skipped:", parsed.error.issues[0]?.message, raw);
    }
  }
  cachedPassages = map;
  return cachedPassages;
}
