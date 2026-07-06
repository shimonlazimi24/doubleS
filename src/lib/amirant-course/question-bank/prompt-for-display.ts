/**
 * הורדת מטא-דאטה משורת השאלה כשהיא כבר מוצגת ב-UI (נושא · קושי) — למנוע כפילות מבלבלת.
 */
const READING_SYNTHESIS_DUP_META = /^\s*Reading synthesis \(difficulty \d+, item \d+\):\s*/i;

/**
 * באג ייבוא היסטורי: בשתי שאלות הבנת הנקרא נבלע קטע הקריאה הבא לתוך טקסט השאלה
 * (`... ## 📖 Passage 2: ...`). הקטע מוצג בנפרד (passageId) — חותכים אותו מהשאלה.
 */
const EMBEDDED_PASSAGE_BLOCK = /\s*#{2,4}\s*📖[\s\S]*$/;

export function amirantExamQuestionPromptForDisplay(prompt: string): string {
  return prompt.replace(READING_SYNTHESIS_DUP_META, "").replace(EMBEDDED_PASSAGE_BLOCK, "").trim();
}
