import { expect, test } from "@playwright/test";

test("opens first lesson and marks it completed", async ({ page }) => {
  await page.goto("/prep/amirant/course");
  await page.getByRole("link", { name: "התחלת שיעור ראשון" }).click();

  await expect(page).toHaveURL(/\/prep\/amirant\/course\/lesson\//);
  await expect(page.getByRole("button", { name: "סימון שיעור כהושלם" })).toBeVisible();

  await page.getByRole("button", { name: "סימון שיעור כהושלם" }).click();
  await expect(page.getByText("שיעור הושלם")).toBeVisible();
});
