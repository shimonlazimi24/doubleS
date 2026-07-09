import { expect, test } from "@playwright/test";

// PREP_AUTH_BYPASS=1 מבטל בכוונה את ה-redirect - הטסט רלוונטי רק בלעדיו
test.skip(
  process.env.PREP_AUTH_BYPASS === "1",
  "auth redirect is disabled by PREP_AUTH_BYPASS - run this spec without the flag",
);

test("redirects protected prep page to login when unauthenticated", async ({
  page,
}) => {
  await page.goto("/prep/dashboard");
  await expect(page).toHaveURL(/\/prep\/login/);
  await expect(page.getByRole("heading", { name: "התחברות" })).toBeVisible();
});
