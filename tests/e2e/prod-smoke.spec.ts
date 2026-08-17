import { expect, test } from "@playwright/test";

test.describe("prod smoke", () => {
  test("marketing home loads", async ({ page }) => {
    const res = await page.goto("/prep");
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("grade API rejects bad body", async ({ request }) => {
    const res = await request.post("/api/prep/amirant-course/grade", { data: {} });
    expect([400, 429]).toContain(res.status());
  });

  test("grade API check mode works without leaking keys on 404", async ({ request }) => {
    const res = await request.post("/api/prep/amirant-course/grade", {
      data: { mode: "check", questionId: "definitely-missing-q", selectedOptionId: "a" },
    });
    expect([404, 429]).toContain(res.status());
    if (res.status() === 404) {
      const json = (await res.json()) as Record<string, unknown>;
      expect(json.correctOptionId).toBeUndefined();
      expect(json.explanation).toBeUndefined();
    }
  });

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
