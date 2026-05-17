import { expect, test } from "@playwright/test";

test("redirects protected prep page to login when unauthenticated", async ({
  page,
}) => {
  await page.goto("/prep/dashboard");
  await expect(page).toHaveURL(/\/prep\/login/);
  await expect(page.getByRole("heading", { name: "התחברות" })).toBeVisible();
});
