-- הרץ פעם אחת על DB קיים (לפני / אחרי זרע amirant-demo) אם נוצר עם המגבלה 1–5.
-- Supabase: SQL Editor → Run

ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_difficulty_check;

ALTER TABLE quiz_questions
  ADD CONSTRAINT quiz_questions_difficulty_check CHECK (difficulty >= 1 AND difficulty <= 6);
