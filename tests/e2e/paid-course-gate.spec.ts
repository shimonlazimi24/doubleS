import { expect, test } from "@playwright/test";

/**
 * The paid surfaces must not be reachable without an entitlement.
 *
 * Until 2026-08-20 only `/course/lesson/[lessonId]` checked access, so any
 * signed-in account could open every quiz, practice set and simulation — the
 * part of the product that is actually sold. These routes must never answer
 * with the exercise itself to a caller without paid access: signed out they
 * bounce to login, signed in without payment they bounce to pricing.
 */

const PAID_ROUTES = [
  "/prep/amirant/course/simulation/sim-01",
  "/prep/amirant/course/practice/pr-vocab-1",
  "/prep/amirant/course/quiz/quiz-vocab",
  "/prep/amirant/course/weak-quiz",
  "/prep/amirant/course/analytics",
  "/prep/amirant/course/module/sentence-completion",
];

/** Advertised as free, no card — must stay reachable. */
const FREE_ROUTES = ["/prep/amirant/course/quiz/quiz-entry-diagnostic"];

test.describe("paid course gate", () => {
  for (const route of PAID_ROUTES) {
    test(`${route} is not served to an unauthenticated visitor`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();

      const landed = new URL(page.url()).pathname;
      // Never the exercise itself: either the login flow or the pricing page.
      expect(landed).not.toBe(route);
      expect(
        landed.includes("/login") ||
          landed.includes("/auth") ||
          landed.includes("/pricing") ||
          landed.includes("/onboarding"),
      ).toBe(true);
    });
  }

  for (const route of FREE_ROUTES) {
    test(`${route} stays open as advertised`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      // It may require a session, but it must never redirect to pricing.
      expect(new URL(page.url()).pathname).not.toContain("/pricing");
    });
  }
});
