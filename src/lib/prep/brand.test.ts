import { afterEach, describe, expect, it } from "vitest";
import { isGoogleOAuthEnabledInApp } from "./brand";

describe("isGoogleOAuthEnabledInApp", () => {
  const orig = { ...process.env };

  afterEach(() => {
    process.env.NEXT_PUBLIC_PREP_OAUTH_GOOGLE = orig.NEXT_PUBLIC_PREP_OAUTH_GOOGLE;
    process.env.NEXT_PUBLIC_SUPABASE_URL = orig.NEXT_PUBLIC_SUPABASE_URL;
  });

  it("is on when Supabase URL is set and flag unset", () => {
    delete process.env.NEXT_PUBLIC_PREP_OAUTH_GOOGLE;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    expect(isGoogleOAuthEnabledInApp()).toBe(true);
  });

  it("is off when explicitly disabled", () => {
    process.env.NEXT_PUBLIC_PREP_OAUTH_GOOGLE = "0";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    expect(isGoogleOAuthEnabledInApp()).toBe(false);
  });
});
