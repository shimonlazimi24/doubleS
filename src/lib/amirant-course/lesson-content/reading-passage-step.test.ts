import { describe, expect, it } from "vitest";
import { isReadingPassageCard } from "./reading-passage-step";

describe("isReadingPassageCard", () => {
  it("matches Hebrew קטע labels (with or without ה)", () => {
    expect(
      isReadingPassageCard({
        label: "קטע הקריאה",
        body: "> Despite living in the most connected era in human history, people feel lonely.",
      }),
    ).toBe(true);
    expect(
      isReadingPassageCard({
        label: "הקטע המלא",
        body: "> A long enough English passage for detection purposes here.",
      }),
    ).toBe(true);
  });

  it("matches קטע (המשך) paragraph slices", () => {
    expect(
      isReadingPassageCard({
        label: "קטע (המשך) — אתגרים",
        body: "> However, urban farming is not without its challenges in dense cities today.",
      }),
    ).toBe(true);
  });

  it("matches English-titled blockquote passages", () => {
    expect(
      isReadingPassageCard({
        label: "The Rise of Urban Farming",
        body: [
          "### The Rise of Urban Farming",
          "> In recent years, a growing number of city residents have turned to farming.",
        ].join("\n"),
      }),
    ).toBe(true);
  });

  it("rejects Hebrew explanation slides", () => {
    expect(
      isReadingPassageCard({
        label: "אסטרטגיית פתרון מומלצת",
        body: "סורקים את הקטע ואז קוראים את השאלות לפני הקריאה המעמיקה.",
      }),
    ).toBe(false);
  });

  it("rejects the old broken startsWith(הקטע) assumption alone without body", () => {
    expect(isReadingPassageCard({ label: "קטע הקריאה", body: "" })).toBe(false);
  });
});
