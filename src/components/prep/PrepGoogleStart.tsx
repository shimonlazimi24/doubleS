"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { isGoogleOAuthEnabledInApp } from "@/lib/prep/auth-errors";
import { PREP_BASE } from "@/lib/prep/constants";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { PrepGoogleSignInButton } from "@/components/prep/PrepGoogleSignInButton";
import { Text } from "@/components/ui";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return AMIRANT_CONTINUE_PATH;
  }
  return raw;
}

/**
 * מסלול ההתחברות הראשי: יציאה מיידית ל-Google OAuth בלי מסך ביניים.
 * ה-PKCE verifier נשמר בדפדפן ע"י ה-browser client - חייב להישאר client-side
 * כדי ש-/prep/auth/complete (שמסיים את ההחלפה באותו דפדפן) ימצא אותו.
 * שגיאות מה-callback נוחתות ב-/prep/login (לא כאן) - אין לולאת רידיירקט.
 */
export function PrepGoogleStart() {
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNextPath(searchParams.get("next")), [searchParams]);
  const loginFallback = `${PREP_BASE}/login?next=${encodeURIComponent(next)}`;
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  const start = useMemo(
    () => async () => {
      const client = createPrepSupabaseBrowserClient();
      if (!client || !isGoogleOAuthEnabledInApp()) {
        window.location.replace(loginFallback);
        return;
      }
      // כבר מחוברים? ישר ליעד, בלי סיבוב מיותר דרך Google.
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user) {
        window.location.replace(next);
        return;
      }
      const callbackUrl = `${window.location.origin}${PREP_BASE}/auth/complete?next=${encodeURIComponent(next)}`;
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) setFailed(true);
    },
    [loginFallback, next],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  return (
    <div className="mx-auto max-w-sm space-y-5 text-center">
      <Text as="p" variant="body" className="font-semibold text-ink">
        {failed ? "ההעברה ל-Google לא הצליחה" : "מעבירים אתכם להתחברות עם Google…"}
      </Text>
      <PrepGoogleSignInButton onClick={() => void start()} className="w-full" />
      <Text as="p" variant="bodySm" className="text-muted">
        מעדיפים בלי Google?{" "}
        <Link href={loginFallback} className="font-semibold text-primary hover:underline">
          קבלו קוד כניסה למייל
        </Link>
      </Text>
    </div>
  );
}
