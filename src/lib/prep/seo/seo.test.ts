import { describe, expect, it } from "vitest";
import { PLAN_PRICES_NIS } from "@/lib/prep/pricing-plans";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { EXAM_SCORED_QUESTION_COUNT } from "@/lib/amirant-course/exam-facts";
import { buildLlmsTxtBody } from "@/lib/prep/llms-txt-body";
import {
  AMIRANT_COURSE_COUNTS,
  AMIRANT_FAQ,
  AMIRANT_PLAN_FACTS,
  AMIRANT_SEO_SECTIONS,
} from "@/lib/prep/marketing/amirant-seo-content";
import {
  amirantCourseJsonLd,
  amirantFaqJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  type JsonLdObject,
} from "./json-ld";
import { DESCRIPTION_MAX, PREP_PAGE_META, TITLE_MAX, TITLE_SUFFIX } from "./page-meta";
import { PREP_SITEMAP_PAGES, buildPrepSitemap } from "./sitemap-entries";

const BASE = "https://getprepared.academy";

/** Round-trips through JSON like the <script> tag does, so a Date or undefined would surface here. */
function roundTrip(obj: JsonLdObject): JsonLdObject {
  const json = JSON.stringify(obj);
  expect(json).not.toContain("undefined");
  return JSON.parse(json) as JsonLdObject;
}

describe("course facts", () => {
  it("counts match the manifest the course actually ships", () => {
    const c = AMIRANT_COURSE_COUNTS;
    expect(c.modules).toBe(AMIRANT_PREPARATION_MANIFEST.modules.length);
    expect(c.simulations).toBe(AMIRANT_PREPARATION_MANIFEST.simulations.length);
    // The marketing figures the owner quotes in ads; a manifest change must fail here, not in Google.
    expect(c).toMatchObject({
      modules: 10,
      lessons: 99,
      sentenceCompletionTests: 14,
      restatementSets: 14,
      readingPassages: 10,
      wordFormationTests: 10,
      simulations: 6,
    });
  });

  it("plans quote the checkout prices", () => {
    for (const p of AMIRANT_PLAN_FACTS) expect(p.priceNis).toBe(PLAN_PRICES_NIS[p.id]);
  });

  it("sections and FAQ carry no emoji and no gendered singular", () => {
    const texts = [
      ...AMIRANT_SEO_SECTIONS.flatMap((s) => [s.headingHe, ...s.paragraphsHe, ...(s.bulletsHe ?? [])]),
      ...AMIRANT_FAQ.flatMap((f) => [f.q, f.a]),
    ];
    for (const t of texts) {
      // Emoji live in the astral planes (surrogate pairs) or the misc-symbols block.
      expect(t, t).not.toMatch(/[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿]/);
      // Second-person singular forms; the site addresses the reader in the plural.
      expect(t, t).not.toMatch(/(^|\s)(שלך|אתה|תוכל|תוכלי|תרצה|תרצי)(\s|$|[,.])/);
    }
  });
});

describe("JSON-LD", () => {
  it("Course carries Offers that equal the checkout prices, in ILS", () => {
    const course = roundTrip(amirantCourseJsonLd(BASE));
    expect(course["@type"]).toBe("Course");
    const offers = course.offers as Array<Record<string, string>>;
    expect(offers.map((o) => o.price)).toEqual(
      AMIRANT_PLAN_FACTS.map((p) => String(PLAN_PRICES_NIS[p.id])),
    );
    expect(new Set(offers.map((o) => o.priceCurrency))).toEqual(new Set(["ILS"]));
    expect(offers.every((o) => o.url === `${BASE}/prep/pricing`)).toBe(true);
    expect((course.provider as JsonLdObject).name).toBe("PREPARE");
    expect((course.syllabusSections as unknown[]).length).toBe(AMIRANT_COURSE_COUNTS.modules);
  });

  it("FAQPage mirrors the visible FAQ list one-to-one", () => {
    const faq = roundTrip(amirantFaqJsonLd());
    const entities = faq.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;
    expect(entities.map((e) => e.name)).toEqual(AMIRANT_FAQ.map((f) => f.q));
    expect(entities.map((e) => e.acceptedAnswer.text)).toEqual(AMIRANT_FAQ.map((f) => f.a));
    expect(entities.length).toBeGreaterThanOrEqual(6);
  });

  it("FAQ answers quote exam-facts, not hand-typed numbers", () => {
    const structure = AMIRANT_FAQ.find((f) => f.q.includes("כמה שאלות"))!;
    expect(structure.a).toContain(`${EXAM_SCORED_QUESTION_COUNT} שאלות`);
    const price = AMIRANT_FAQ.find((f) => f.q.includes("כמה עולה"))!;
    for (const p of AMIRANT_PLAN_FACTS) expect(price.a).toContain(`${p.priceNis} ₪`);
  });

  it("Organization and WebSite share one @id so pages reference a single publisher", () => {
    const org = roundTrip(organizationJsonLd(BASE));
    const site = roundTrip(websiteJsonLd(BASE));
    expect((site.publisher as JsonLdObject)["@id"]).toBe(org["@id"]);
    expect(org.email).toBe("support@getprepared.academy");
  });

  it("Article uses the organization as author and falls back dateModified to datePublished", () => {
    const a = roundTrip(
      articleJsonLd(BASE, {
        path: "/prep/blog/x",
        title: "t",
        description: "d",
        datePublished: "2026-07-22",
        keywords: ["a", "b"],
      }),
    );
    expect(a.dateModified).toBe("2026-07-22");
    expect((a.author as JsonLdObject)["@type"]).toBe("Organization");
    expect(a.keywords).toBe("a, b");
    expect((a.mainEntityOfPage as JsonLdObject)["@id"]).toBe(`${BASE}/prep/blog/x`);
  });

  it("BreadcrumbList positions are 1-based and absolute", () => {
    const b = roundTrip(breadcrumbJsonLd(BASE, [{ name: "a", path: "/prep" }, { name: "b", path: "/prep/x" }]));
    const items = b.itemListElement as Array<{ position: number; item: string }>;
    expect(items.map((i) => i.position)).toEqual([1, 2]);
    expect(items[1]!.item).toBe(`${BASE}/prep/x`);
  });
});

describe("page metadata", () => {
  const entries = Object.entries(PREP_PAGE_META);

  it("titles fit a SERP line including the layout suffix; descriptions fit a snippet", () => {
    for (const [key, m] of entries) {
      const full = key === "home" ? m.title : `${m.title}${TITLE_SUFFIX}`;
      expect(full.length, `${key} title: ${full}`).toBeLessThanOrEqual(TITLE_MAX);
      expect(m.description.length, `${key} description`).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(m.description.length, `${key} description too short`).toBeGreaterThanOrEqual(50);
    }
  });

  it("every title and description is unique", () => {
    expect(new Set(entries.map(([, m]) => m.title)).size).toBe(entries.length);
    expect(new Set(entries.map(([, m]) => m.description)).size).toBe(entries.length);
  });

  it("the money pages name the exam in the title", () => {
    for (const key of ["home", "amirant", "pricing"] as const) {
      expect(PREP_PAGE_META[key].title).toContain("אמירנט");
    }
  });
});

describe("sitemap", () => {
  const posts = [
    { slug: "a", date: "2026-07-22" },
    { slug: "b", date: "2026-07-22", updated: "2026-09-01" },
  ];

  it("lists every public page plus each post, and nothing that redirects or needs login", () => {
    const urls = buildPrepSitemap(BASE, posts).map((e) => e.url);
    for (const p of PREP_SITEMAP_PAGES) expect(urls).toContain(`${BASE}${p.path}`);
    expect(urls).toContain(`${BASE}/prep/blog/a`);
    for (const bad of ["/prep/login", "/prep/toefl", "/prep/amirant/course", "/prep/amirant/info", "/prep/amirant/continue"]) {
      expect(urls).not.toContain(`${BASE}${bad}`);
    }
  });

  it("lastmod is a stable content date, never build time", () => {
    const entries = buildPrepSitemap(BASE, posts);
    const today = new Date();
    for (const e of entries) {
      const d = e.lastModified as Date;
      expect(d.getTime()).toBeLessThanOrEqual(today.getTime() + 24 * 3600 * 1000);
      expect(Number.isNaN(d.getTime())).toBe(false);
    }
    const blogIndex = entries.find((e) => e.url === `${BASE}/prep/blog`)!;
    expect((blogIndex.lastModified as Date).toISOString().slice(0, 10)).toBe("2026-09-01");
    const postB = entries.find((e) => e.url === `${BASE}/prep/blog/b`)!;
    expect((postB.lastModified as Date).toISOString().slice(0, 10)).toBe("2026-09-01");
  });

  it("drops the blog index when there are no posts", () => {
    expect(buildPrepSitemap(BASE, []).map((e) => e.url)).not.toContain(`${BASE}/prep/blog`);
  });
});

describe("llms.txt", () => {
  const body = buildLlmsTxtBody(BASE, [
    { slug: "what-is-amirant", title: "מה זה אמירנט", description: "d", date: "2026-07-22" },
  ]);

  it("states prices, course inventory, the disclaimer and the links an agent needs", () => {
    for (const p of AMIRANT_PLAN_FACTS) expect(body).toContain(`${p.priceNis} ₪`);
    expect(body).toContain(`${AMIRANT_COURSE_COUNTS.lessons} שיעורים`);
    expect(body).toContain(`${AMIRANT_COURSE_COUNTS.simulations} סימולציות`);
    expect(body).toContain("אינו קשור");
    expect(body).toContain(`${BASE}/prep/pricing`);
    expect(body).toContain(`${BASE}/prep/blog/what-is-amirant`);
    expect(body).toContain("support@getprepared.academy");
    for (const f of AMIRANT_FAQ) expect(body).toContain(f.q);
  });

  it("renders without a post list too", () => {
    expect(buildLlmsTxtBody(BASE)).not.toContain("## מדריכים בבלוג");
  });
});
