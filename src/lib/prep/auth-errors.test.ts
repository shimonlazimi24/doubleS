import { describe, expect, it } from "vitest";
import { mapSupabaseAuthError } from "./auth-errors";

describe("mapSupabaseAuthError", () => {
  it("maps disabled Google provider", () => {
    const msg = mapSupabaseAuthError("Unsupported provider: provider is not enabled");
    expect(msg).toContain("Google לא מופעלת");
  });
});
