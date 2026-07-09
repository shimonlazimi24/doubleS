/** הדומיין הציבורי של המוצר - קבוע מותג, לא תלוי סביבת פריסה. */
export const PREP_PRODUCTION_ORIGIN = "https://getprepared.academy";

/**
 * Canonical public origin (metadata, sitemap, llms.txt, OG URLs).
 * סדר: NEXT_PUBLIC_APP_URL מפורש → **בפרודקשן תמיד הדומיין הרשמי** →
 * VERCEL_URL רק ב-preview → localhost בפיתוח.
 * לקח מהשקה: בלי הקבוע, sitemap שלם הצביע ל-double-s-*.vercel.app
 * כי משתנה הסביבה לא הוגדר - וגוגל היה מאנדקס את הדומיין הלא נכון.
 */
export function getPublicSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");

  // בפרודקשן: הדומיין הרשמי תמיד - גם אם ה-env הוגדר בטעות לכתובת vercel.app
  // (קרה בפועל: NEXT_PUBLIC_APP_URL הצביע ל-branch alias וכל ה-sitemap יצא שגוי)
  if (process.env.VERCEL_ENV === "production") {
    if (explicit && !/\.vercel\.app(\/|$)/i.test(explicit)) return explicit;
    return PREP_PRODUCTION_ORIGIN;
  }

  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
