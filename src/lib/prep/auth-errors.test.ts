import { describe, expect, it } from "vitest";
import { mapSupabaseAuthError } from "./auth-errors";

describe("mapSupabaseAuthError", () => {
  it("maps disabled Google provider", () => {
    const msg = mapSupabaseAuthError("Unsupported provider: provider is not enabled");
    expect(msg).toContain("Google לא מופעלת");
  });

  it("maps email rate limit by code", () => {
    const msg = mapSupabaseAuthError({
      message: "Email rate limit exceeded",
      code: "over_email_send_rate_limit",
      status: 429,
    });
    expect(msg).toContain("Supabase חסם");
    expect(msg).toContain("Google");
  });
});
