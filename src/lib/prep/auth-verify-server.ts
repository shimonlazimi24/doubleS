import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EmailOtpType } from "@supabase/supabase-js";

type VerifyInput = {
  url: string;
  anonKey: string;
  email?: string;
  secret: string;
  typeParam: string;
};

type VerifyResult = { ok: true } | { ok: false; message: string };

function uniqueTypes(typeParam: string): EmailOtpType[] {
  const raw = [typeParam, "email", "magiclink", "signup", "invite"] as EmailOtpType[];
  return Array.from(new Set(raw));
}

/** Try verifyOtp with token / token_hash and several OTP types. */
export async function verifyPrepAuthToken(
  supabase: SupabaseClient,
  input: VerifyInput,
): Promise<VerifyResult> {
  const { email, secret, typeParam } = input;
  let lastMessage = "verify_failed";

  for (const otpType of uniqueTypes(typeParam)) {
    const attempts = email
      ? [
          supabase.auth.verifyOtp({ email, token: secret, type: otpType }),
          supabase.auth.verifyOtp({ email, token_hash: secret, type: otpType }),
        ]
      : [supabase.auth.verifyOtp({ token_hash: secret, type: otpType })];

    for (const attempt of attempts) {
      const { error } = await attempt;
      if (!error) return { ok: true };
      lastMessage = error.message;
    }
  }

  return { ok: false, message: lastMessage };
}

/**
 * Server-only: mint a fresh magic link via service role and verify immediately.
 * Works when hashed_token from CLI does not match Supabase's expected OTP shape.
 */
export async function verifyPrepAuthWithAdminLink(
  supabase: SupabaseClient,
  input: VerifyInput & { serviceRoleKey: string; redirectTo: string },
): Promise<VerifyResult> {
  const { url, serviceRoleKey, email, redirectTo } = input;
  if (!email?.includes("@")) {
    return { ok: false, message: "email_required_for_admin_verify" };
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) return { ok: false, message: error.message };

  const actionLink = data.properties?.action_link;
  if (!actionLink) return { ok: false, message: "no_action_link" };

  const action = new URL(actionLink);
  const rawToken = action.searchParams.get("token");
  const linkType = action.searchParams.get("type") || "email";
  if (!rawToken) return { ok: false, message: "no_token_in_action_link" };

  return verifyPrepAuthToken(supabase, {
    ...input,
    secret: rawToken,
    typeParam: linkType,
  });
}
