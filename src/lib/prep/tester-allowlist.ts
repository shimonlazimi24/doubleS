/**
 * רשימת בודקים בחינם - מיילים מ-`PREP_TESTER_EMAILS` (מופרדים בפסיק).
 * בודק שנכנס לקורס מקבל אוטומטית entitlement מסוג 'admin' לשנה
 * (ראו ensure-tester-entitlement.server.ts) - מובחן מלקוחות משלמים ב-DB.
 *
 * ניהול: Vercel → Settings → Environment Variables → PREP_TESTER_EMAILS
 * למשל: PREP_TESTER_EMAILS=friend@gmail.com, tester2@walla.co.il
 * (שינוי דורש Redeploy - ההענקה עצמה נשמרת ב-DB גם אם המייל יוסר אחר כך.)
 */
export function getPrepTesterEmails(): Set<string> {
  const raw = process.env.PREP_TESTER_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@")),
  );
}

export function isPrepTesterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getPrepTesterEmails().has(email.trim().toLowerCase());
}
