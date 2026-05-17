/**
 * הורדת מטא-דאטה משורת השאלה כשהיא כבר מוצגת ב-UI (נושא · קושי) — למנוע כפילות מבלבלת.
 */
const READING_SYNTHESIS_DUP_META = /^\s*Reading synthesis \(difficulty \d+, item \d+\):\s*/i;

export function amirantExamQuestionPromptForDisplay(prompt: string): string {
  return prompt.replace(READING_SYNTHESIS_DUP_META, "").trim();
}
