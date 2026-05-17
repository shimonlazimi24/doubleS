"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PREP_BASE } from "@/lib/prep/constants";
import { isGoogleOAuthEnabledInApp, mapSupabaseAuthError } from "@/lib/prep/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "קישור ההתחברות לא תקין. נסו שוב.",
  missing_config: "המערכת לא מוגדרת (Supabase). פנו לתמיכה.",
  auth: "ההתחברות נכשלה. נסו שוב.",
};

function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return `${PREP_BASE}/amirant/course/dashboard`;
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
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const next = encodeURIComponent(returnTo);
    return `${window.location.origin}${PREP_BASE}/auth/callback?next=${next}`;
  }, [returnTo]);

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

  async function signInWithGoogle() {
    setMessage(null);
    const client = createPrepSupabaseBrowserClient();
    if (!client) {
      setMessage("חסרים משתני Supabase.");
      return;
    }
    setBusy(true);
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    setBusy(false);
    if (error) setMessage(mapSupabaseAuthError(error.message));
  }

  const showGoogle = isGoogleOAuthEnabledInApp();

  return (
    <div className="mx-auto max-w-md space-y-6">
      {errorKey ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {ERROR_MESSAGES[errorKey] ?? "שגיאת התחברות."}
        </p>
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

      {showGoogle ? (
        <>
          <div className="relative flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-line/80" aria-hidden />
            <span className="text-xs text-muted">או</span>
            <span className="h-px flex-1 bg-line/80" aria-hidden />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full min-h-11"
            disabled={busy}
            onClick={() => void signInWithGoogle()}
          >
            התחברות עם Google
          </Button>
        </>
      ) : null}

      {message ? (
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <Text as="p" variant="caption" className="text-muted">
        אחרי התחברות תועברו ל־{returnTo}. התקדמות מקומית תמוזג לחשבון שלכם.
      </Text>
    </div>
  );
}
