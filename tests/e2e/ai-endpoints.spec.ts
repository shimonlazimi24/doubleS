import { expect, test } from "@playwright/test";

test("deterministic ai-analysis endpoint returns structured payload", async ({
  request,
}) => {
  const res = await request.post("/api/prep/amirant-course/ai-analysis", {
    data: {
      stats: {
        weakTopics: ["vocabulary"],
        strongTopics: ["reading_comprehension"],
        byTopic: {
          vocabulary: { correct: 5, total: 10 },
        },
        improvementHint: "stable",
      },
      lessonSnippets: [
        {
          lessonId: "lesson-1",
          title: "Vocabulary basics",
          moduleTitle: "Vocabulary",
          snippet: "focus on collocations",
        },
      ],
    },
  });

  expect([200, 429]).toContain(res.status());
  if (res.status() === 200) {
    const json = (await res.json()) as {
      text?: string;
      source?: string;
      model?: string;
    };
    expect(json.source).toBe("deterministic");
    expect(typeof json.text).toBe("string");
    expect(json.model).toBe("none");
  }
});

test("authenticated ai endpoints are protected (or missing config)", async ({
  request,
}) => {
  const endpoints = [
    "/api/prep/amirant-course/ai/lesson-chat",
    "/api/prep/amirant-course/ai/quiz-review",
    "/api/prep/amirant-course/ai/recommendations",
    "/api/prep/amirant-course/ai/coach-summary",
  ];

  for (const endpoint of endpoints) {
    const res = await request.post(endpoint, { data: {} });
    expect([401, 429, 500]).toContain(res.status());
  }
});
