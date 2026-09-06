import { describe, expect, it } from "vitest";
import { AMIRANT_GENERAL_BANK_QUESTIONS } from "./index";
import { AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC } from "./client-bank";

/**
 * `weak-quiz.ts` picks question ids in the browser from the public bank so that
 * the answer keys stay on the server. That is only safe if the public bank is
 * the full bank with the answers removed — same items, same order — because the
 * picker is deterministic and the server route uses the full bank. If the two
 * ever diverged, a learner's local fallback would build a different quiz than
 * the API, and `questions.public.json` would be silently stale.
 */

describe("public bank mirrors the full bank", () => {
  it("has the same ids in the same order", () => {
    expect(AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC.map((q) => q.id)).toEqual(
      AMIRANT_GENERAL_BANK_QUESTIONS.map((q) => q.id),
    );
  });

  it("agrees on topic and difficulty for every item", () => {
    const full = new Map(AMIRANT_GENERAL_BANK_QUESTIONS.map((q) => [q.id, q]));
    for (const q of AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC) {
      const f = full.get(q.id);
      expect(f, `${q.id} is in the public bank but not the full one`).toBeDefined();
      expect(q.topicSlug).toBe(f!.topicSlug);
      expect(q.difficulty).toBe(f!.difficulty);
    }
  });

  it("carries no answer keys", () => {
    for (const q of AMIRANT_GENERAL_BANK_QUESTIONS_PUBLIC) {
      expect(q).not.toHaveProperty("correctOptionId");
      expect(q).not.toHaveProperty("explanation");
    }
  });
});
