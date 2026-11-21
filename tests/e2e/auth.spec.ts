import { expect, test } from "@playwright/test";

// PREP_AUTH_BYPASS=1 מבטל בכוונה את ה-redirect - הטסט רלוונטי רק בלעדיו
test.skip(
  process.env.PREP_AUTH_BYPASS === "1",
  "auth redirect is disabled by PREP_AUTH_BYPASS - run this spec without the flag",
);

test("sends an unauthenticated visitor of a protected page to the login page", async ({ page }) => {
  await page.goto("/prep/dashboard");
  // The login page offers Google and the email code; it must not jump into Google by itself.
  await expect(page).toHaveURL(/\/prep\/login\?next=%2Fprep%2Fdashboard/);
});
