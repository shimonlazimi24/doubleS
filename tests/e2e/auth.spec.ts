import { expect, test } from "@playwright/test";

// PREP_AUTH_BYPASS=1 מבטל בכוונה את ה-redirect - הטסט רלוונטי רק בלעדיו
test.skip(
  process.env.PREP_AUTH_BYPASS === "1",
  "auth redirect is disabled by PREP_AUTH_BYPASS - run this spec without the flag",
);

test("redirects protected prep page straight into Google sign-in when unauthenticated", async ({
  page,
}) => {
  await page.goto("/prep/dashboard");
  // אנונימיים → /prep/auth/google, שמזניק מיד OAuth; מתקבל כל שלב בשרשרת.
  await expect(page).toHaveURL(/\/prep\/auth\/google|accounts\.google|supabase/);
});
