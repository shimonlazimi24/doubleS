"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { getPrepSupabasePublishableEnv } from "@/lib/prep/supabase/env";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { PREP_BASE } from "@/lib/prep/constants";
import { isGoogleOAuthEnabledInApp, mapSupabaseAuthError } from "@/lib/prep/auth-errors";
import { PrepGoogleSignInButton } from "@/components/prep/PrepGoogleSignInButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "קישור ההתחברות לא תקין או שפג תוקפו. בקשו קוד חדש.",
  missing_config: "המערכת לא מוגדרת (Supabase). פנו לתמיכה.",
  auth: "ההתחברות נכשלה. בקשו קוד חדש ונסו שוב (תוקף הקוד ~5 דק׳).",
  pkce_mismatch:
    "הקישור נפתח בדפדפן אחר מזה שבו ביקשתם את המייל. הדרך הקלה: בקשו קוד חדש והקלידו כאן את 6 הספרות מהמייל — זה עובד מכל מכשיר.",
};

function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return AMIRANT_CONTINUE_PATH;
  }
  return raw;
}

export function PrepLoginForm() {
  const searchParams = useSearchParams();
  const returnTo = useMemo(
    () => safeReturnPath(searchParams.get("returnTo") ?? searchParams.get("next")),
    [searchParams],
  );
  const errorKey = searchParams.get("error");
  const errorDetail = searchParams.get("detail");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const next = encodeURIComponent(returnTo);
    return `${window.location.origin}${PREP_BASE}/auth/complete?next=${next}`;
  }, [returnTo]);

  const showGoogle = isGoogleOAuthEnabledInApp();
  const supabaseReady = Boolean(getPrepSupabasePublishableEnv());

  async function signInWithGoogle() {
    setMessage(null);
    const client = createPrepSupabaseBrowserClient();
    if (!client) {
      setMessage("חסרים משתני Supabase. הגדירו NEXT_PUBLIC_SUPABASE_URL ו־ANON_KEY.");
      return;
    }
    setBusy(true);
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setBusy(false);
      setMessage(mapSupabaseAuthError(error));
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const client = createPrepSupabaseBrowserClient();
    if (!client) {
      setMessage("חסרים משתני Supabase. הגדירו NEXT_PUBLIC_SUPABASE_URL ו־ANON_KEY.");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setMessage("הזינו כתובת דוא״ל.");
      return;
    }
    setBusy(true);
    const { error } = await client.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: callbackUrl },
    });
    setBusy(false);
    if (error) {
      setMessage(mapSupabaseAuthError(error));
      return;
    }
    setSent(true);
  }

  /**
   * אימות בקוד 6 ספרות — עובד מכל דפדפן/מכשיר, בניגוד לקישור (PKCE) שחייב
   * להיפתח באותו דפדפן שביקש אותו. זה המסלול הראשי; הקישור נשאר כנוחות.
   */
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const client = createPrepSupabaseBrowserClient();
    if (!client) {
      setMessage("חסרים משתני Supabase. הגדירו NEXT_PUBLIC_SUPABASE_URL ו־ANON_KEY.");
      return;
    }
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      setMessage("הקוד הוא 6 ספרות — כפי שמופיע במייל.");
      return;
    }
    setBusy(true);
    const { error } = await client.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    if (error) {
      setBusy(false);
      setMessage(mapSupabaseAuthError(error));
      return;
    }
    // ניווט מלא (לא router.push) כדי שה-middleware יראה את עוגיית הסשן מיד
    window.location.assign(returnTo);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {errorKey ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {errorDetail?.includes("pkce_mismatch")
            ? ERROR_MESSAGES.pkce_mismatch
            : (ERROR_MESSAGES[errorKey] ?? "שגיאת התחברות.")}
          {errorDetail ? (
            <span className="mt-2 block font-mono text-xs opacity-80">{errorDetail}</span>
          ) : null}
        </p>
      ) : null}

      {showGoogle && supabaseReady ? (
        <PrepGoogleSignInButton disabled={busy} onClick={() => void signInWithGoogle()} />
      ) : null}

      {showGoogle && supabaseReady && !sent ? (
        <div className="relative flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-line/80" aria-hidden />
          <span className="text-xs text-muted">או עם דוא״ל</span>
          <span className="h-px flex-1 bg-line/80" aria-hidden />
        </div>
      ) : null}

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-line/80 bg-canvas px-4 py-4">
            <Text as="p" variant="body">
              שלחנו מייל ל־<strong>{email.trim()}</strong> עם <strong>קוד בן 6 ספרות</strong> וקישור
              התחברות. בדקו גם בספאם.
            </Text>
          </div>
          <form onSubmit={verifyCode} className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">הקוד מהמייל</span>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
                placeholder="123456"
                dir="ltr"
                className="text-center text-xl font-bold tracking-[0.4em] tabular-nums"
                autoFocus
              />
            </label>
            <Button type="submit" variant="primary" className="w-full min-h-11" disabled={busy}>
              {busy ? "מאמת…" : "כניסה"}
            </Button>
          </form>
          <div className="flex items-center justify-between text-xs text-muted">
            <button
              type="button"
              className="underline underline-offset-2 hover:text-ink"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setCode("");
                setMessage(null);
              }}
            >
              שליחה חוזרת / כתובת אחרת
            </button>
            <span>אפשר גם ללחוץ על הקישור במייל — באותו דפדפן</span>
          </div>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">דוא״ל</span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <Button type="submit" variant="primary" className="w-full min-h-11" disabled={busy}>
            {busy ? "שולח…" : "שליחת קישור התחברות"}
          </Button>
        </form>
      )}

      {message ? (
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <Text as="p" variant="caption" className="text-muted">
        אחרי התחברות תועברו ל־{returnTo}. התקדמות מקומית תמוזג לחשבון שלכם.
      </Text>

      {showGoogle && !supabaseReady ? (
        <Text as="p" variant="caption" className="text-amber-800">
          להתחברות עם Google יש להגדיר Supabase בשרת (ראו docs/SUPABASE_AUTH_SETUP.md).
        </Text>
      ) : null}
    </div>
  );
}
