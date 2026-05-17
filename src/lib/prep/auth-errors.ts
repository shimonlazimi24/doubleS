import type { AuthError } from "@supabase/supabase-js";

type AuthErrorInput = AuthError | { message: string; code?: string; status?: number } | string;

function normalize(input: AuthErrorInput): { message: string; code: string; status?: number } {
  if (typeof input === "string") {
    return { message: input, code: "" };
  }
  return {
    message: input.message ?? "",
    code: ("code" in input && input.code) || "",
    status: "status" in input ? input.status : undefined,
  };
}

/**
 * Maps Supabase Auth API errors to user-facing Hebrew messages.
 */
export function mapSupabaseAuthError(input: AuthErrorInput): string {
  const { message, code, status } = normalize(input);
  const m = message.toLowerCase();
  const c = code.toLowerCase();

  if (c === "over_email_send_rate_limit" || m.includes("over_email_send_rate_limit")) {
    return [
      "Supabase חסם שליחת מיילי התחברות זמנית (מגבלת אבטחה — גם אם לא קיבלתם מייל קודם).",
      "המתינו כ־60 דקות, או התחברו עם Google למטה.",
      "לפיתוח תכוף: ב-Supabase → Authentication → Rate Limits / SMTP מותאם (ראו docs/SUPABASE_AUTH_SETUP.md).",
    ].join(" ");
  }

  if (m.includes("email rate limit") || status === 429) {
    return "יותר מדי בקשות התחברות בקצרה. המתינו כשעה או השתמשו ב-Google.";
  }

  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return [
      "התחברות עם Google לא מופעלת בפרויקט Supabase.",
      "בלוח Supabase: Authentication → Providers → Google → Enable, והזינו Client ID ו-Secret מ-Google Cloud.",
      "ראו docs/SUPABASE_AUTH_SETUP.md בפרויקט.",
    ].join(" ");
  }

  if (m.includes("redirect") && m.includes("url")) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain";
    return [
      "כתובת החזרה (redirect) לא מורשית.",
      "הוסיפו ב-Supabase → Authentication → URL Configuration את:",
      `${origin}/prep/auth/complete`,
    ].join(" ");
  }

  if (m.includes("signup is disabled") || c === "signup_disabled") {
    return "הרשמה חדשה כבויה ב-Supabase. הפעילו Sign-ups ב-Authentication → Providers → Email.";
  }

  if (m.includes("invalid api key") || c === "invalid_api_key") {
    return "מפתח Supabase שגוי ב-Vercel. השתמשו ב-anon JWT (eyJ…) מטאב Legacy, לא sb_publishable.";
  }

  if (m.includes("email address") && m.includes("invalid")) {
    return "כתובת הדוא״ל לא תקינה.";
  }

  if (m.includes("error sending confirmation email") || m.includes("smtp")) {
    return [
      "שליחת המייל נכשלה ב-Supabase.",
      "בדקו Authentication → SMTP / Email templates, או הגדירו ספק דוא״ל (Resend, SendGrid).",
    ].join(" ");
  }

  return message || "שגיאת התחברות. נסו שוב או פנו לתמיכה.";
}

export { isGoogleOAuthEnabledInApp } from "@/lib/prep/brand";
