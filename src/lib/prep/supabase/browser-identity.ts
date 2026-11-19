"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The signed-in user's id, in the browser, fetched once.
 *
 * Two problems this solves, both measured on the live course page:
 *
 * 1. Three providers — access, progress and persistence — each called
 *    `auth.getUser()` independently on mount. The network log showed seven
 *    requests to `/auth/v1/user` for one page load.
 * 2. `getUser()` always goes to the network: it asks the auth server to verify
 *    the token. With the database in Tokyo and the app in the US that is roughly
 *    400ms per call. `getSession()` reads the token the client already holds.
 *
 * Using the local session is safe here because nothing is authorised in the
 * browser. The id is only used to scope queries; what a user may actually read
 * or write is decided by row-level security in Postgres, which validates the
 * token itself. A tampered id in the browser buys nothing.
 */

let inFlight: Promise<string | null> | null = null;
let cached: { userId: string | null } | null = null;
let listening = false;

/**
 * Another tab can sign out or switch account while this one stays open. The
 * cached id would then belong to the previous account while the token belongs
 * to the new one, and every query would come back empty (paid access shown as
 * locked, progress gone). Reload so the tab starts again as the current user.
 */
function followSession(client: SupabaseClient): void {
  if (listening) return;
  listening = true;
  client.auth.onAuthStateChange((event, session) => {
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
    const nextId = session?.user?.id ?? null;
    const previous = cached?.userId ?? null;
    cached = null;
    inFlight = null;
    if (previous && previous !== nextId) window.location.reload();
  });
}

export async function getBrowserUserId(client: SupabaseClient): Promise<string | null> {
  followSession(client);
  if (cached) return cached.userId;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const {
      data: { session },
    } = await client.auth.getSession();
    const userId = session?.user?.id ?? null;
    cached = { userId };
    return userId;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Call when the session changes (sign in / sign out) so the next read is fresh. */
export function clearBrowserUserIdCache(): void {
  cached = null;
  inFlight = null;
}
