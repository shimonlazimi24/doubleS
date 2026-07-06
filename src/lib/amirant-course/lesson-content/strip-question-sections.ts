/**
 * מסיר משיעורי "מבחן תרגול" את השאלות השטוחות (וה-Answer Key) מה-markdown —
 * הן מרונדרות במקומן כרכיב אינטראקטיבי מהבנק (ראו lesson-question-groups.ts).
 * ההסברים/אסטרטגיות שלפני השאלות נשארים.
 */

// בלי \b אחרי עברית — ב-JS זהו גבול ASCII בלבד ולעולם לא יתאים אחרי אות עברית
const ANSWERS_HEADING =
  /^##[^\n]*(Answers?\s+and\s+Explanations|Answer\s+Key|תשובות\s+והסברים|תשובות)(?=[\s:.!?،-]|$)/im;

/** תחילת אזור השאלות: כותרת Questions / קטע / שאלה ראשונה / טופס תשובות. */
const QUESTIONS_START_PATTERNS = [
  /^##\s+Part 1: Questions\s*$/m,
  /^##\s+Part 1: The Passage.*$/m,
  /^##\s+📖\s*(The\s+)?Passage.*$/m,
  /^##\s+📖\s*Part 1: Questions.*$/m,
  /^##\s+Questions?\b.*$/m,
  /^###\s+Question\s+1\b.*$/m,
  /^\*\*Q1\.\*\*.*$/m,
  /^##\s+📋\s*טופס תשובות.*$/m,
];

/**
 * חותך את גוף השיעור כך שנשאר רק החלק ההסברי שלפני השאלות.
 * אם לא זוהה אזור שאלות — הגוף מוחזר כמו שהוא.
 */
export function stripQuestionSections(body: string): string {
  let cutAt = -1;
  for (const pattern of QUESTIONS_START_PATTERNS) {
    const m = pattern.exec(body);
    if (m && m.index >= 0 && (cutAt === -1 || m.index < cutAt)) cutAt = m.index;
  }
  const answers = ANSWERS_HEADING.exec(body);
  if (answers && (cutAt === -1 || answers.index < cutAt)) cutAt = answers.index;

  if (cutAt <= 0) return body;
  return body.slice(0, cutAt).replace(/\n{3,}/g, "\n\n").trimEnd();
}
