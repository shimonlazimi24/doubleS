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
  missing_code: "קישור ההתחברות לא תקין או שפג תוקף. בקשו קישור חדש.",
  missing_config: "המערכת לא מוגדרת (Supabase). פנו לתמיכה.",
  auth:
    "ההתחברות נכשלה. פתחו את הקישור באותו דפדפן שבו ביקשתם אותו, או בקשו קישור חדש (תוקף ~5 דק׳).",
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
      setMessage(mapSupabaseAuthError(error.message));
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
      setMessage(mapSupabaseAuthError(error.message));
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {errorKey ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {ERROR_MESSAGES[errorKey] ?? "שגיאת התחברות."}
          {errorDetail && process.env.NODE_ENV === "development" ? (
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
        <div className="rounded-xl border border-line/80 bg-canvas px-4 py-5">
          <Text as="p" variant="body">
            שלחנו קישור התחברות ל־<strong>{email.trim()}</strong>. בדקו את תיבת הדוא״ל (וגם ספאם).
          </Text>
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
