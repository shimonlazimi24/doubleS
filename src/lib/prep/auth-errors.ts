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

  const unavailable = "ההתחברות לא זמינה כרגע. נסו שוב בעוד כמה דקות או כתבו ל-support@getprepared.academy.";

  if (
    c === "over_email_send_rate_limit" ||
    m.includes("over_email_send_rate_limit") ||
    m.includes("email rate limit") ||
    status === 429
  ) {
    return "שלחנו יותר מדי מיילים לכתובת הזו. נסו שוב בעוד שעה, או התחברו עם Google.";
  }

  if (m.includes("email address") && m.includes("invalid")) {
    return "כתובת הדוא״ל לא תקינה.";
  }

  if (m.includes("expired") || m.includes("otp") || (m.includes("token") && m.includes("invalid"))) {
    return "הקוד שגוי או שפג תוקפו. בקשו קוד חדש ונסו שוב.";
  }

  // Configuration faults (provider off, redirect not allowed, bad key, SMTP):
  // the learner cannot act on the cause, so it goes to the console, not the screen.
  if (message) {
    // eslint-disable-next-line no-console -- surfaced to error monitoring via console capture
    console.error(`[auth] ${code || status || "error"}: ${message}`);
  }
  return unavailable;
}

export { isGoogleOAuthEnabledInApp } from "@/lib/prep/brand";
