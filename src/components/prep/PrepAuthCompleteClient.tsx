"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container } from "@/components/ui";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return AMIRANT_CONTINUE_PATH;
  return raw;
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("flow state") || m.includes("code verifier") || m.includes("pkce")) {
    return "קישור לא תואם לדפדפן. בקשו קישור חדש ופתחו אותו באותו חלון שבו שלחתם את המייל.";
  }
  if (m.includes("expired") || m.includes("invalid")) {
    return "הקישור פג תוקף או כבר נוצל. בקשו קישור חדש.";
  }
  return "ההתחברות נכשלה. נסו שוב או בקשו קישור חדש.";
}

/**
 * Finishes magic-link / OAuth in the browser (PKCE code verifier lives in cookies here).
 */
export function PrepAuthCompleteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("מאמתים התחברות…");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const next = safeNext(searchParams.get("next"));
      const loginWithError = (detail: string) => {
        const q = new URLSearchParams({
          error: "auth",
          returnTo: next,
          detail: detail.slice(0, 120),
        });
        router.replace(`${PREP_BASE}/login?${q.toString()}`);
      };

      const client = createPrepSupabaseBrowserClient();
      if (!client) {
        if (!cancelled) setMessage("חסרים משתני Supabase בשרת.");
        loginWithError("missing_config");
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await client.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });
          if (error) throw error;
        } else if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const access_token = hash.get("access_token");
          const refresh_token = hash.get("refresh_token");
          if (!access_token || !refresh_token) throw new Error("missing_hash_tokens");
          const { error } = await client.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else {
          const {
            data: { session },
            error,
          } = await client.auth.getSession();
          if (error) throw error;
          if (!session) throw new Error("missing_code");
        }

        const {
          data: { session },
          error: sessionError,
        } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error("no_session_after_exchange");

        if (!cancelled) router.replace(next);
      } catch (err) {
        const detail = err instanceof Error ? err.message : "unknown";
        if (!cancelled) setMessage(mapAuthError(detail));
        loginWithError(detail);
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <Container className="py-16">
      <p className="text-center text-muted" role="status" aria-live="polite">
        {message}
      </p>
    </Container>
  );
}
