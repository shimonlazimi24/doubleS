import { describe, expect, it } from "vitest";
import { isVocabCardDue, rateVocabCard } from "./srs-storage";

describe("vocab SRS", () => {
  const now = new Date("2026-08-19T12:00:00Z");

  it("schedules first 'good' for tomorrow", () => {
    const card = rateVocabCard(undefined, "good", now);
    expect(card.intervalDays).toBe(1);
    expect(isVocabCardDue(card, now)).toBe(false);
  });

  it("puts 'again' due today", () => {
    const card = rateVocabCard({ reps: 3, intervalDays: 7, dueAt: "2026-08-19T12:00:00Z" }, "again", now);
    expect(card.intervalDays).toBe(0);
    expect(isVocabCardDue(card, now)).toBe(true);
  });
});
