"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthError, EmailOtpType } from "@supabase/supabase-js";
import { createPrepSupabaseBrowserClient } from "@/lib/prep/supabase/browser";
import { AMIRANT_CONTINUE_PATH } from "@/lib/prep/amirant-continue";
import { PREP_BASE } from "@/lib/prep/constants";
import { Container } from "@/components/ui";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return AMIRANT_CONTINUE_PATH;
  return raw;
}

function isPkceMismatch(err: AuthError | Error): boolean {
  const m = err.message.toLowerCase();
  return m.includes("flow state") || m.includes("code verifier") || m.includes("pkce");
}

function readHashSession(): { access_token: string; refresh_token: string } | null {
  if (typeof window === "undefined" || !window.location.hash.includes("access_token=")) return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access_token = hash.get("access_token");
  const refresh_token = hash.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

/**
 * Finishes magic-link / OAuth in the browser.
 * Order: URL hash (implicit) → token_hash → PKCE code (needs same browser as OTP request).
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
          detail: detail.slice(0, 160),
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
        const hashTokens = readHashSession();
        if (hashTokens) {
          const { error } = await client.auth.setSession(hashTokens);
          if (error) throw error;
        } else if (tokenHash && type) {
          const otpTypes: EmailOtpType[] = [type as EmailOtpType, "email", "magiclink"];
          let lastError: AuthError | null = null;
          for (const otpType of otpTypes) {
            const { error } = await client.auth.verifyOtp({
              token_hash: tokenHash,
              type: otpType,
            });
            if (!error) {
              lastError = null;
              break;
            }
            lastError = error;
          }
          if (lastError) throw lastError;
        } else if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) {
            const hashRetry = readHashSession();
            if (hashRetry) {
              const { error: hashErr } = await client.auth.setSession(hashRetry);
              if (hashErr) throw hashErr;
            } else if (isPkceMismatch(error)) {
              throw new Error("pkce_mismatch");
            } else {
              throw error;
            }
          }
        } else {
          const {
            data: { session },
            error,
          } = await client.auth.getSession();
          if (error) throw error;
          if (!session) throw new Error("missing_auth_params");
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
        if (!cancelled) {
          setMessage(
            detail.includes("pkce_mismatch")
              ? "הקישור נפתח בדפדפן אחר. חוזרים למסך ההתחברות - הקלידו שם את הקוד מהמייל."
              : "ההתחברות נכשלה…",
          );
        }
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
