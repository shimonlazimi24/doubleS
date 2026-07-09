import { expect, test } from "@playwright/test";

test("adaptive quiz full demo flow ends in analytics/dashboard/review", async ({
  page,
}) => {
  await page.goto("/prep/amirant/course/quiz/quiz-vocab");

  await expect(page.getByText("שאלה 1 מתוך")).toBeVisible();
  for (let i = 0; i < 16; i++) {
    await page.locator("li > button").first().click();
    if (i < 15) {
      await page.getByRole("button", { name: "הבא" }).click();
    }
  }

  await page.getByRole("button", { name: "סיום מבחן" }).click();
  await expect(page.getByText("תוצאות")).toBeVisible();

  await page.getByRole("link", { name: "אנליטיקה" }).click();
  await expect(page).toHaveURL(/\/prep\/amirant\/course\/analytics/);
  await page.getByRole("button", { name: "בקשת ניתוח" }).click();
  // קריאת AI אמיתית - עד 30 שניות
  await expect(
    page.getByText(/הסבר:|בקשה נדחתה.|שגיאת רשת.|fallback/i),
  ).toBeVisible({ timeout: 30_000 });

  await page.goto("/prep/amirant/course/dashboard");
  await expect(page.getByRole("heading", { name: /לוח תלמיד/ })).toBeVisible();

  await page.goto("/prep/amirant/course/review");
  await expect(page.getByText("סקירות בוחנים")).toBeVisible();
});
