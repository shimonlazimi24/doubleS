import { describe, expect, it } from "vitest";
import { isPrepCacheablePath, isPrepPublicPath } from "./constants";

/**
 * A cached per-user page is a far worse bug than a slow one: it would serve one
 * learner's progress to another from the CDN. These lock the boundary between
 * "no session needed to open it" and "identical for every visitor".
 */

const MARKETING = [
  "/prep",
  "/prep/amirant",
  "/prep/amirant/info",
  "/prep/courses",
  "/prep/pricing",
  "/prep/blog",
  "/prep/blog/what-is-amirant",
  "/prep/about",
  "/prep/contact",
  "/prep/terms",
  "/prep/privacy",
];

/** Public in the sense of "reachable", but personalised — never cacheable. */
const PERSONALISED = [
  "/prep/amirant/course",
  "/prep/amirant/continue",
  "/prep/login",
  "/prep/dashboard",
  "/prep/settings",
  "/prep/admin",
  "/prep/admin/learners",
  "/prep/amirant/course/simulation/sim-01",
];

describe("cacheable paths", () => {
  it("caches the marketing pages", () => {
    for (const path of MARKETING) {
      expect(isPrepCacheablePath(path), `${path} should be cacheable`).toBe(true);
    }
  });

  it("never caches a page that depends on who is asking", () => {
    for (const path of PERSONALISED) {
      expect(isPrepCacheablePath(path), `${path} must not be cacheable`).toBe(false);
    }
  });

  it("keeps 'public' and 'cacheable' as separate ideas", () => {
    // The trap this guards: /prep/amirant/course is public but per-user.
    expect(isPrepPublicPath("/prep/amirant/course")).toBe(true);
    expect(isPrepCacheablePath("/prep/amirant/course")).toBe(false);
  });
});
