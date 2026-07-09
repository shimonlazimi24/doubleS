import { expect, test } from "@playwright/test";

test("placement quiz: intro screen, fixed 15 questions, normalized score, no review link", async ({
  page,
}) => {
  // כניסה משיעור מבחן הרמה - מפנה לחידון
  await page.goto("/prep/amirant/course/lesson/lesson.intro.diagnostic");
  await expect(page).toHaveURL(/\/prep\/amirant\/course\/quiz\/quiz-entry-diagnostic/);

  // מסך פתיחה: כותרת, מבנה, כפתור התחלה - ובלי טיימר רץ
  await expect(page.getByRole("heading", { name: "מבחן רמה" })).toBeVisible();
  await expect(page.getByRole("button", { name: "התחל מבחן" })).toBeVisible();
  await expect(page.getByText("שאלה 1 מתוך")).not.toBeVisible();

  await page.getByRole("button", { name: "התחל מבחן" }).click();

  // טולבר: רק "שאלה X מתוך 15", בלי "רמה נוכחית"
  await expect(page.getByText("שאלה 1 מתוך 15")).toBeVisible();
  await expect(page.getByText("רמה נוכחית")).not.toBeVisible();
  await expect(page.getByLabel("זמן שנותר")).toBeVisible();

  for (let i = 0; i < 15; i++) {
    await page.locator("li > button").first().click();
    if (i === 12) {
      // שאלות הבנת הנקרא - קטע קריאה מוצג
      await expect(page.getByText("הבנת הנקרא")).toBeVisible();
    }
    if (i < 14) {
      await page.getByRole("button", { name: "הבא" }).click();
    }
  }

  await page.getByRole("button", { name: "סיום מבחן" }).click();

  // תוצאות: ציון מנורמל 50–150, בלי "מעבר לסקירה"
  await expect(page.getByText("ציון משוער בסולם 50–150")).toBeVisible();
  await expect(page.getByRole("link", { name: /מעבר לסקירה/ })).not.toBeVisible();
  await expect(page.getByRole("link", { name: /מפת דרכים אישית/ })).toBeVisible();
});
