import { describe, expect, it } from "vitest";
import { PLAN_PRICES_NIS } from "@/lib/prep/pricing-plans";
import { AMIRANT_PREPARATION_MANIFEST } from "@/lib/amirant-course";
import { EXAM_SCORED_QUESTION_COUNT } from "@/lib/amirant-course/exam-facts";
import { buildLlmsTxtBody } from "@/lib/prep/llms-txt-body";
import { buildLlmsFullTxtBody } from "@/lib/prep/llms-full-txt-body";
import { listBlogPosts } from "@/lib/prep/blog.server";
import { blogInternalLinks, blogTopicOf, blogWordCount } from "@/lib/prep/blog-meta";
import { SAMPLE_QUESTIONS } from "@/lib/prep/marketing/sample-questions";
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
  sampleQuestionsQuizJsonLd,
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
      lessons: 136,
      sentenceCompletionTests: 14,
      restatementSets: 14,
      readingPassages: 10,
      wordFormationTests: 10,
      listeningTests: 14,
      grammarTests: 12,
      writingTasks: 14,
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

describe("guides", () => {
  const posts = listBlogPosts();

  it("ships the seven guides and the three original posts", () => {
    const slugs = posts.map((p) => p.slug);
    for (const s of [
      "what-is-amirant",
      "amirant-passing-score",
      "amirant-reform-2026",
      "amirant-exam-structure-2026",
      "amirant-vs-amir",
      "amirant-listening-section",
      "amirant-writing-task",
      "amirant-grammar-in-context",
      "amirant-word-formation",
      "how-long-to-prepare-for-amirant",
    ]) {
      expect(slugs).toContain(s);
    }
  });

  it("every post fits the SERP, is dated, keyworded, long enough and links inward", () => {
    for (const p of posts) {
      const full = `${p.title}${TITLE_SUFFIX}`;
      expect(full.length, `${p.slug} title: ${full}`).toBeLessThanOrEqual(TITLE_MAX);
      expect(p.description.length, `${p.slug} description`).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(p.description.length, `${p.slug} description too short`).toBeGreaterThanOrEqual(50);
      expect(p.date, `${p.slug} date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (p.updated) expect(p.updated >= p.date, `${p.slug} updated before date`).toBe(true);
      expect(p.keywords.length, `${p.slug} keywords`).toBeGreaterThanOrEqual(3);
      expect(blogWordCount(p.body), `${p.slug} words`).toBeGreaterThanOrEqual(800);
      const links = blogInternalLinks(p.body);
      expect(links, `${p.slug} internal links`).toContain("/prep/amirant");
      expect(links.some((l) => l.startsWith("/prep/blog/")), `${p.slug} sibling guide link`).toBe(true);
      expect(p.body, `${p.slug} sources line`).toContain("nite.org.il");
      // Emoji live in the astral planes (surrogate pairs) or the misc-symbols block.
      expect(`${p.title}${p.description}${p.body}`, `${p.slug} emoji`).not.toMatch(/[\uD83C-\uD83E][\uDC00-\uDFFF]|[☀-➿]/);
      expect(p.body, `${p.slug} singular address`).not.toMatch(/(^|\s)(שלך|אתה|תוכל|תוכלי|תרצה|תרצי)(\s|$|[,.])/);
    }
  });

  it("every sibling link points at a post that exists", () => {
    const slugs = new Set(posts.map((p) => p.slug));
    for (const p of posts) {
      for (const l of blogInternalLinks(p.body).filter((l) => l.startsWith("/prep/blog/"))) {
        expect(slugs.has(l.replace("/prep/blog/", "")), `${p.slug} -> ${l}`).toBe(true);
      }
    }
  });

  it("every post files under a topic, and titles are unique", () => {
    for (const p of posts) expect(blogTopicOf(p.slug).id, p.slug).not.toBe("other");
    expect(new Set(posts.map((p) => p.title)).size).toBe(posts.length);
    expect(new Set(posts.map((p) => p.description)).size).toBe(posts.length);
  });

  it("the sample questions page is in the sitemap and in page-meta, with a Quiz that mirrors the list", () => {
    const urls = buildPrepSitemap(BASE, []).map((e) => e.url);
    expect(urls).toContain(`${BASE}/prep/amirant/sample-questions`);
    expect(PREP_PAGE_META.sampleQuestions.title).toContain("אמירנט");
    expect(SAMPLE_QUESTIONS.length).toBeGreaterThanOrEqual(8);
    expect(SAMPLE_QUESTIONS.length).toBeLessThanOrEqual(10);
    for (const q of SAMPLE_QUESTIONS) expect(q.correct, q.id).toBeLessThan(q.options.length);
    const quiz = roundTrip(sampleQuestionsQuizJsonLd(BASE));
    const parts = quiz.hasPart as Array<{ name: string; acceptedAnswer: { text: string } }>;
    expect(parts.map((p) => p.name)).toEqual(SAMPLE_QUESTIONS.map((q) => q.stem));
    expect(parts.map((p) => p.acceptedAnswer.text)).toEqual(SAMPLE_QUESTIONS.map((q) => q.options[q.correct]));
  });

  it("llms-full.txt carries every guide in full and llms.txt points at it", () => {
    const full = buildLlmsFullTxtBody(BASE, posts);
    for (const p of posts) {
      expect(full).toContain(`## ${p.title}`);
      expect(full).toContain(`${BASE}/prep/blog/${p.slug}`);
      // The markdown link to the hub becomes an absolute URL in parentheses.
      expect(full).toContain(`(${BASE}/prep/amirant)`);
    }
    expect(full).not.toMatch(/\]\(\/prep/);
    const short = buildLlmsTxtBody(BASE, posts);
    expect(short).toContain(`${BASE}/llms-full.txt`);
    expect(short).toContain(`${BASE}/prep/amirant/sample-questions`);
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
