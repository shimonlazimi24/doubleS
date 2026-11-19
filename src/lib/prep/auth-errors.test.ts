import { describe, expect, it, vi } from "vitest";
import { mapSupabaseAuthError } from "./auth-errors";

describe("mapSupabaseAuthError", () => {
  it("never shows configuration details to a learner", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const msg = mapSupabaseAuthError("Unsupported provider: provider is not enabled");
    expect(msg).toContain("לא זמינה כרגע");
    expect(msg).not.toMatch(/Supabase|Vercel|docs\//);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("maps email rate limit by code", () => {
    const msg = mapSupabaseAuthError({
      message: "Email rate limit exceeded",
      code: "over_email_send_rate_limit",
      status: 429,
    });
    expect(msg).toContain("יותר מדי מיילים");
    expect(msg).toContain("Google");
  });

  it("explains a wrong or expired code", () => {
    expect(mapSupabaseAuthError("Token has expired or is invalid")).toContain("הקוד שגוי");
  });
});
