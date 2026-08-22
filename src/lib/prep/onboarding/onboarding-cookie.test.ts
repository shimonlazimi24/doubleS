import { describe, expect, it } from "vitest";
import {
  hasOnboardingCookie,
  onboardingCookieValue,
  PREP_ONBOARDING_COOKIE,
} from "./gate";

/**
 * The cookie exists only to skip a database round trip in the middleware. It
 * decides whether to redirect someone to the onboarding form and nothing else —
 * course access and payments are checked against the database. These lock the
 * one property that does matter: it must not carry across accounts.
 */

describe("onboarding cookie", () => {
  it("matches only the user it was issued for", () => {
    const user = "83e48dc5-b42b-41aa-9f0e-000000000001";
    const other = "11111111-2222-3333-4444-555555555555";
    const value = onboardingCookieValue(user);

    expect(hasOnboardingCookie(value, user)).toBe(true);
    expect(hasOnboardingCookie(value, other)).toBe(false);
  });

  it("treats a missing or empty cookie as not onboarded", () => {
    const user = "83e48dc5-b42b-41aa-9f0e-000000000001";
    expect(hasOnboardingCookie(undefined, user)).toBe(false);
    expect(hasOnboardingCookie("", user)).toBe(false);
  });

  it("rejects a forged value that is not this user's id", () => {
    const user = "83e48dc5-b42b-41aa-9f0e-000000000001";
    expect(hasOnboardingCookie("true", user)).toBe(false);
    expect(hasOnboardingCookie("1", user)).toBe(false);
    expect(hasOnboardingCookie("yes", user)).toBe(false);
  });

  it("has a stable name so the middleware and the app agree", () => {
    expect(PREP_ONBOARDING_COOKIE).toBe("prep_onboarded");
  });
});
