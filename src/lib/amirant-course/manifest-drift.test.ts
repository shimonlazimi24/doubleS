import { describe, expect, it } from "vitest";
import { AMIRANT_PREPARATION_MANIFEST } from "./manifest";
import { buildAmirantManifestFromSource } from "./manifest-source";

/**
 * `manifest.ts` reads a file generated at build time rather than deriving the
 * manifest from the authoring source, because deriving it pulled 2.8MB of
 * content JSON — answer keys included — into the browser bundle.
 *
 * The price of that is a generated file that can go stale. This test rebuilds
 * from source and fails if the two disagree, so a content ingest that forgets
 * `node scripts/generate-course-manifest.mjs` is caught here rather than by a
 * learner meeting a lesson that is not in the sidebar.
 */

describe("generated manifest matches the authoring source", () => {
  const fromSource = buildAmirantManifestFromSource();

  it("is identical to what the builder produces", () => {
    expect(AMIRANT_PREPARATION_MANIFEST).toEqual(fromSource);
  });

  it("carries a real course, not an empty shell", () => {
    expect(AMIRANT_PREPARATION_MANIFEST.modules.length).toBeGreaterThan(0);
    const lessons = AMIRANT_PREPARATION_MANIFEST.modules.flatMap((m) => m.lessons);
    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      expect(lesson.id, "every lesson needs an id").toBeTruthy();
      expect(lesson.title, `${lesson.id} needs a title`).toBeTruthy();
    }
  });

  it("keeps lesson and module ids unique", () => {
    const moduleIds = AMIRANT_PREPARATION_MANIFEST.modules.map((m) => m.id);
    expect(new Set(moduleIds).size).toBe(moduleIds.length);

    const lessonIds = AMIRANT_PREPARATION_MANIFEST.modules.flatMap((m) =>
      m.lessons.map((l) => l.id),
    );
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
  });

  it("carries no answer keys — the manifest is structure only", () => {
    const serialized = JSON.stringify(AMIRANT_PREPARATION_MANIFEST);
    expect(serialized).not.toContain("correctOptionId");
    expect(serialized).not.toContain("explanation");
  });
});
