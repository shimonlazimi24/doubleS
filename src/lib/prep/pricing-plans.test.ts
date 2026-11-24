import { describe, expect, it } from "vitest";
import {
  EXTENSION_GRACE_DAYS,
  PLAN_DAYS,
  PLAN_LABELS,
  PLAN_PRICES_NIS,
  extensionDeadline,
  isExtensionWindowOpen,
} from "./pricing-plans";
import { amirantCourseJsonLd } from "./seo/json-ld";

/**
 * A displayed price that differs from the charged price is a consumer-protection
 * problem, and a stale price in the JSON-LD ends up in Google's index. The
 * offers used to be written out by hand next to the real table; these lock the
 * three views of a price together.
 */

const PURCHASE_PLANS = ["week", "two_weeks", "month"] as const;

describe("pricing plans", () => {
  it("charges the advertised prices", () => {
    expect(PLAN_PRICES_NIS.week).toBe(179);
    expect(PLAN_PRICES_NIS.two_weeks).toBe(229);
    expect(PLAN_PRICES_NIS.month).toBe(299);
  });

  it("gives every purchasable plan a duration and a label", () => {
    for (const planId of PURCHASE_PLANS) {
      expect(PLAN_DAYS[planId]).toBeGreaterThan(0);
      expect(PLAN_LABELS[planId]).toBeTruthy();
    }
  });

  it("never prices a longer plan below a shorter one", () => {
    expect(PLAN_PRICES_NIS.week!).toBeLessThan(PLAN_PRICES_NIS.two_weeks!);
    expect(PLAN_PRICES_NIS.two_weeks!).toBeLessThan(PLAN_PRICES_NIS.month!);
  });

  it("publishes the same prices to Google as it charges", () => {
    const jsonLd = amirantCourseJsonLd("https://getprepared.academy");
    const offers = jsonLd.offers as { price: string; name: string }[];

    expect(offers).toHaveLength(PURCHASE_PLANS.length);
    for (const planId of PURCHASE_PLANS) {
      const offer = offers.find((o) => o.name === PLAN_LABELS[planId]);
      expect(offer, `no offer published for ${planId}`).toBeDefined();
      expect(offer!.price).toBe(String(PLAN_PRICES_NIS[planId]));
    }
  });
});

describe("extension window", () => {
  const ends = "2026-11-26T06:42:31.966Z";

  it("is open while access is active and up to the grace period after it ends", () => {
    expect(isExtensionWindowOpen(ends, new Date("2026-11-20T00:00:00Z"))).toBe(true);
    expect(isExtensionWindowOpen(ends, new Date("2026-12-26T06:42:31.966Z"))).toBe(true);
  });

  it("closes the moment the grace period is over", () => {
    expect(isExtensionWindowOpen(ends, new Date("2026-12-26T06:42:32.000Z"))).toBe(false);
  });

  it("puts the deadline exactly EXTENSION_GRACE_DAYS after access ends", () => {
    const deadline = extensionDeadline(ends);
    expect(deadline?.getTime()).toBe(Date.parse(ends) + EXTENSION_GRACE_DAYS * 86_400_000);
  });
});
