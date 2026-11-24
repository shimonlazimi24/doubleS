import { expect, test } from "@playwright/test";

test.describe("prod smoke", () => {
  test("marketing home loads", async ({ page }) => {
    const res = await page.goto("/prep");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  // Question, grade and word-grade answer only signed-in learners: anonymous
  // grading was an answer oracle for the question bank.
  for (const route of ["grade", "grade-word", "questions"]) {
    test(`${route} API is locked without a session and leaks no answer`, async ({ request }) => {
      const res = await request.post(`/api/prep/amirant-course/${route}`, {
        data: { mode: "check", questionId: "definitely-missing-q", selectedOptionId: "a", ids: ["x"] },
      });
      expect([401, 429]).toContain(res.status());
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      expect(json.correctOptionId).toBeUndefined();
      expect(json.explanation).toBeUndefined();
    });
  }

  test("ai-analysis stays locked without session", async ({ request }) => {
    const res = await request.post("/api/prep/amirant-course/ai-analysis", {
      data: {
        stats: { weakTopics: [], strongTopics: [], byTopic: {}, improvementHint: "stable" },
        lessonSnippets: [],
      },
    });
    expect([401, 403, 429]).toContain(res.status());
  });

  test("health endpoint is not open", async ({ request }) => {
    const res = await request.get("/api/prep/amirant-course/ai/health");
    expect([401, 403, 404, 405, 429, 500]).toContain(res.status());
  });
});
