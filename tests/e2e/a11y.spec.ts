import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility gate (IS 5568 / WCAG 2.1 AA) - runs axe-core on the public
 * marketing pages and on the course screens behind the login.
 *
 * Course pages need the dev server started with PREP_AUTH_BYPASS=1 and
 * NEXT_PUBLIC_PREP_HAS_FULL_ACCESS=1 (playwright.a11y.config.ts does that).
 *
 *   npm run test:a11y
 *   A11Y_REPORT=1 npm run test:a11y   # print every violation node, not just the summary
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

type Violation = {
  id: string;
  impact: string | null | undefined;
  help: string;
  nodes: { target: unknown[]; failureSummary?: string }[];
};

const IMPACT_ORDER = ["critical", "serious", "moderate", "minor"] as const;

function summarize(label: string, violations: Violation[]): string {
  const byImpact = new Map<string, Violation[]>();
  for (const v of violations) {
    const key = v.impact ?? "unknown";
    byImpact.set(key, [...(byImpact.get(key) ?? []), v]);
  }
  const lines = [`axe ${label}: ${violations.length} violation rule(s)`];
  for (const impact of [...IMPACT_ORDER, "unknown"]) {
    const list = byImpact.get(impact);
    if (!list?.length) continue;
    lines.push(`  ${impact}:`);
    for (const v of list) {
      lines.push(`    - ${v.id} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"}): ${v.help}`);
      if (process.env.A11Y_REPORT) {
        for (const n of v.nodes.slice(0, 8)) {
          lines.push(`        ${JSON.stringify(n.target)}`);
          if (n.failureSummary) lines.push(`        ${n.failureSummary.replace(/\n/g, " | ")}`);
        }
      }
    }
  }
  return lines.join("\n");
}

async function auditPage(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const violations = results.violations as Violation[];
  const summary = summarize(label, violations);
  // eslint-disable-next-line no-console
  console.log(summary);
  // Compare rule ids, not the raw axe objects: a failure then prints the summary, not a 300-line diff.
  expect(violations.map((v) => `${v.impact}: ${v.id}`), summary).toEqual([]);
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  // The lesson/quiz pages mount client islands after hydration.
  await page.waitForTimeout(300);
}

const PUBLIC_PAGES = [
  "/prep",
  "/prep/amirant",
  "/prep/pricing",
  "/prep/about",
  "/prep/blog",
  "/prep/blog/what-is-amirant",
  "/prep/login",
  "/prep/accessibility",
] as const;

for (const path of PUBLIC_PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await settle(page);
    await auditPage(page, path);
  });
}

test.describe("course (auth bypass)", () => {
  test("axe: /prep/amirant/course", async ({ page }) => {
    await page.goto("/prep/amirant/course");
    await settle(page);
    await expect(page.getByRole("navigation", { name: "ניווט בקורס" })).toBeVisible();
    await auditPage(page, "/prep/amirant/course");
  });

  test("axe: lesson", async ({ page }) => {
    await page.goto("/prep/amirant/course/lesson/lesson.sc.test-01");
    await settle(page);
    await auditPage(page, "/prep/amirant/course/lesson/lesson.sc.test-01");
  });

  test("axe: placement quiz question", async ({ page }) => {
    await page.goto("/prep/amirant/course/quiz/quiz-entry-diagnostic");
    await settle(page);
    await auditPage(page, "quiz intro");
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    await expect(page.getByText("שאלה 1 מתוך")).toBeVisible();
    await page.getByRole("radio").first().waitFor();
    await auditPage(page, "quiz question");
  });

  test("axe: /prep/amirant/course/dashboard", async ({ page }) => {
    await page.goto("/prep/amirant/course/dashboard");
    await settle(page);
    await auditPage(page, "/prep/amirant/course/dashboard");
  });
});

test.describe("keyboard", () => {
  test("skip link is the first tab stop and lands on main", async ({ page }) => {
    await page.goto("/prep");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "דילוג לתוכן הראשי" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("quiz options are a radiogroup with arrow-key navigation", async ({ page }) => {
    await page.goto("/prep/amirant/course/quiz/quiz-entry-diagnostic");
    await settle(page);
    await page.getByRole("button", { name: "התחל מבחן" }).click();
    const group = page.getByRole("radiogroup").first();
    await expect(group).toBeVisible();
    const radios = group.getByRole("radio");
    await radios.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(radios.nth(1)).toBeFocused();
    await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowUp");
    await expect(radios.first()).toBeFocused();
    await expect(radios.first()).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("zoom 200%", () => {
  for (const path of ["/prep", "/prep/amirant", "/prep/pricing"] as const) {
    test(`no horizontal scroll at 200% on ${path}`, async ({ page }) => {
      // 200% zoom on a 1280px window = a 640px CSS viewport.
      await page.setViewportSize({ width: 640, height: 720 });
      await page.goto(path);
      await settle(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow of ${overflow}px on ${path}`).toBeLessThanOrEqual(0);
    });
  }
});
