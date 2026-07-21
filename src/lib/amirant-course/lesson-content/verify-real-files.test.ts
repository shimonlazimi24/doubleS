import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { splitMarkdownIntoSections } from "@/lib/amirant-course/lesson-content/split-markdown-lesson";
import { expandSectionFlowToLessonCards } from "@/lib/amirant-course/lesson-content/microsection-split";
import { stripHtmlAnchorNoise } from "@/lib/amirant-course/lesson-content/strip-lesson-markdown-noise";

const FILES = [
  "content/amirnet-course/04_sentence_completion/4.2_solving_methods_master_guide.md",
  "content/amirnet-course/04_sentence_completion/4.3_common_traps_guide.md",
  "content/amirnet-course/05_restatement/5.2_solving_methods_master_guide.md",
  "content/amirnet-course/06_reading_comprehension/6.2_solving_methods_master_guide.md",
  "content/amirnet-course/07_new_reform_audio_writing/7.1_reform_overview.md",
  "content/amirnet-course/07_new_reform_audio_writing/7.2_listening_guide.md",
];

function buildCards(md: string, title: string) {
  const { sections } = splitMarkdownIntoSections(md, title);
  return sections.flatMap((s) =>
    expandSectionFlowToLessonCards({ id: s.id, title: s.heading, variant: s.variant, body: s.body }),
  );
}

describe("real course files → slide cards", () => {
  for (const rel of FILES) {
    describe(rel, () => {
      const md = fs.readFileSync(path.join(process.cwd(), rel), "utf8");
      const cards = buildCards(md, rel);

      it("produces cards", () => {
        expect(cards.length).toBeGreaterThan(3);
      });

      it("no card has an unbalanced code fence", () => {
        for (const c of cards) {
          const fences = (c.body?.match(/```/g) ?? []).length;
          expect(fences % 2, `odd fence count in card "${c.stepLabel}"`).toBe(0);
        }
      });

      it("no rendered card leaks details/summary tags", () => {
        for (const c of cards) {
          const rendered = stripHtmlAnchorNoise(c.body ?? "");
          expect(rendered).not.toMatch(/<\/?(details|summary)/i);
        }
      });

      it("a card with answer options also carries the question fence (atomic questions)", () => {
        for (const c of cards) {
          const b = c.body ?? "";
          if (/^\(D\)\s/m.test(b) && b.includes("(A)") === false) {
            throw new Error(`orphan option (D) without (A) in card "${c.stepLabel}"`);
          }
        }
      });
    });
  }
});
