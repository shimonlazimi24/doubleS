/**
 * Maps Supabase Auth API errors to user-facing Hebrew messages.
 */
export function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return [
      "התחברות עם Google לא מופעלת בפרויקט Supabase.",
      "בלוח Supabase: Authentication → Providers → Google → Enable, והזינו Client ID ו-Secret מ-Google Cloud.",
      "ראו docs/SUPABASE_AUTH_SETUP.md בפרויקט.",
    ].join(" ");
  }

  if (m.includes("redirect") && m.includes("url")) {
    return [
      "כתובת החזרה (redirect) לא מורשית.",
      "הוסיפו ב-Supabase → Authentication → URL Configuration את:",
      `${typeof window !== "undefined" ? window.location.origin : "https://your-domain"}${"/prep/auth/callback"}`,
    ].join(" ");
  }

  if (m.includes("email rate limit") || m.includes("over_email_send_rate_limit")) {
    return "נשלחו יותר מדי מיילים בקצרה. המתינו כמה דקות ונסו שוב.";
  }

  if (m.includes("signup is disabled")) {
    return "הרשמה חדשה כבויה ב-Supabase. הפעילו Sign-ups ב-Authentication → Providers → Email.";
  }

  return message;
}

export { isGoogleOAuthEnabledInApp } from "@/lib/prep/brand";
