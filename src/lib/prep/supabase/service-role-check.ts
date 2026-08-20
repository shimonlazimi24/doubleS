/**
 * Confirms that `SUPABASE_SERVICE_ROLE_KEY` actually carries service-role rights.
 *
 * Why this exists: `prep_payments` has no INSERT policy by design — writes are
 * service-role only, and service role bypasses RLS. When the variable holds an
 * anon/publishable key instead, `createClient` still succeeds, the insert runs
 * with anon rights, and Postgres answers 42501 ("new row violates row-level
 * security policy"). Checkout then fails for every buyer while the app reports
 * only a generic error. That happened in production on 2026-08-20.
 *
 * The check is offline: it reads the key's own claims, never contacts Supabase.
 */

export type ServiceRoleKeyStatus =
  | { ok: true; format: "jwt" | "secret" }
  | { ok: false; reason: "missing" | "not_service_role" | "unparsable"; detail: string };

function decodeJwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    const claims = JSON.parse(json) as { role?: unknown };
    return typeof claims.role === "string" ? claims.role : null;
  } catch {
    return null;
  }
}

export function checkServiceRoleKey(
  rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY,
): ServiceRoleKeyStatus {
  const key = rawKey?.trim();
  if (!key) {
    return { ok: false, reason: "missing", detail: "SUPABASE_SERVICE_ROLE_KEY is not set" };
  }

  // Newer Supabase secret keys are opaque and prefixed rather than JWTs.
  if (key.startsWith("sb_secret_")) return { ok: true, format: "secret" };
  if (key.startsWith("sb_publishable_")) {
    return {
      ok: false,
      reason: "not_service_role",
      detail: "key is a publishable key (sb_publishable_…), not a secret key",
    };
  }

  const role = decodeJwtRole(key);
  if (role === null) {
    return {
      ok: false,
      reason: "unparsable",
      detail: "key is neither an sb_secret_ key nor a decodable JWT",
    };
  }
  if (role !== "service_role") {
    return {
      ok: false,
      reason: "not_service_role",
      detail: `key carries role "${role}" — expected "service_role"`,
    };
  }
  return { ok: true, format: "jwt" };
}

let warned = false;

/**
 * Logs once per process when the key cannot write past RLS. Returns the status so
 * a caller that must write (checkout, payment callback) can fail with a message
 * that names the real cause instead of "try again".
 */
export function assertServiceRoleKeyForWrites(context: string): ServiceRoleKeyStatus {
  const status = checkServiceRoleKey();
  if (!status.ok && !warned) {
    warned = true;
    // eslint-disable-next-line no-console -- a silent failure here breaks every purchase
    console.error(
      `[supabase] ${context}: SUPABASE_SERVICE_ROLE_KEY cannot bypass RLS — ${status.detail}. ` +
        "Writes to prep_payments will fail with Postgres 42501.",
    );
  }
  return status;
}
