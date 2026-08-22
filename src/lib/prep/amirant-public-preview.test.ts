import { describe, expect, it } from "vitest";
import {
  isPrepAmirantCoursePublicPreviewPath,
  PUBLIC_PREVIEW_RULES,
} from "./amirant-public-preview";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course/manifest";
import { AMIRANT_FREE_MODULE_SLUGS, isAmirantModuleFree } from "./course-access";

/**
 * The middleware decides what is readable without logging in, and it must do so
 * without importing the course manifest — that pulled 2.5MB of content JSON into
 * a bundle that runs on every request to the site.
 *
 * The price of that is a hand-written rule, so these tests check it against the
 * manifest. If someone adds a lesson to the free module, or makes another module
 * free, this fails rather than quietly locking or unlocking the wrong pages.
 */

describe("public preview rules match the manifest", () => {
  const freeModules = AMIRANT_PREPARATION_MANIFEST.modules.filter(isAmirantModuleFree);

  it("covers every lesson in every free module", () => {
    expect(freeModules.length).toBeGreaterThan(0);
    for (const mod of freeModules) {
      for (const lesson of mod.lessons) {
        expect(
          PUBLIC_PREVIEW_RULES.freeLessonIds.has(lesson.id),
          `${lesson.id} is in the free module "${mod.slug}" but is not listed as free`,
        ).toBe(true);
        expect(
          isPrepAmirantCoursePublicPreviewPath(`/prep/amirant/course/lesson/${lesson.id}`),
        ).toBe(true);
      }
    }
  });

  it("covers every quiz in every free module", () => {
    for (const mod of freeModules) {
      for (const quiz of mod.quizzes) {
        expect(
          PUBLIC_PREVIEW_RULES.freeQuizIds.has(quiz.id),
          `${quiz.id} is in the free module "${mod.slug}" but is not listed as free`,
        ).toBe(true);
      }
    }
  });

  it("opens nothing from a paid module", () => {
    const paid = AMIRANT_PREPARATION_MANIFEST.modules.filter((m) => !isAmirantModuleFree(m));
    expect(paid.length).toBeGreaterThan(0);
    for (const mod of paid) {
      expect(isPrepAmirantCoursePublicPreviewPath(`/prep/amirant/course/module/${mod.slug}`)).toBe(
        false,
      );
      for (const lesson of mod.lessons.slice(0, 3)) {
        expect(
          isPrepAmirantCoursePublicPreviewPath(`/prep/amirant/course/lesson/${lesson.id}`),
          `${lesson.id} is in paid module "${mod.slug}" and must not be public`,
        ).toBe(false);
      }
      for (const quiz of mod.quizzes) {
        expect(
          isPrepAmirantCoursePublicPreviewPath(`/prep/amirant/course/quiz/${quiz.id}`),
          `${quiz.id} is in paid module "${mod.slug}" and must not be public`,
        ).toBe(false);
      }
    }
  });

  it("knows the free module slugs the rest of the app uses", () => {
    for (const mod of freeModules) {
      expect(AMIRANT_FREE_MODULE_SLUGS.has(mod.slug)).toBe(true);
      expect(isPrepAmirantCoursePublicPreviewPath(`/prep/amirant/course/module/${mod.slug}`)).toBe(
        true,
      );
    }
  });

  it("opens the course home and nothing outside the course", () => {
    expect(isPrepAmirantCoursePublicPreviewPath("/prep/amirant/course")).toBe(true);
    expect(isPrepAmirantCoursePublicPreviewPath("/prep/amirant/course/")).toBe(true);
    expect(isPrepAmirantCoursePublicPreviewPath("/prep/amirant/course/dashboard")).toBe(false);
    expect(isPrepAmirantCoursePublicPreviewPath("/prep/settings")).toBe(false);
  });
});
