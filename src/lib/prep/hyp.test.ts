import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyHypCallback, isHypConfigured } from "./hyp";

const API_KEY = "test-api-key-123";

function signParams(params: Record<string, string>): string {
  const order = ["Id", "CCode", "Amount", "ACode", "Order", "Fild1", "Fild2", "Fild3"];
  const parts: string[] = [];
  if (params.HKId) parts.push(`HKId=${encodeURIComponent(params.HKId)}`);
  for (const key of order) parts.push(`${key}=${encodeURIComponent(params[key] ?? "")}`);
  return createHmac("sha256", API_KEY).update(parts.join("&")).digest("hex");
}

function makeCallback(overrides: Record<string, string> = {}): URLSearchParams {
  const base: Record<string, string> = {
    Id: "12345678",
    CCode: "0",
    Amount: "229",
    ACode: "0012345",
    Order: "order-ref-abc",
    ...overrides,
  };
  const sign = signParams(base);
  return new URLSearchParams({ ...base, Sign: sign });
}

describe("verifyHypCallback", () => {
  beforeEach(() => {
    process.env.HYP_MASOF = "0010131918";
    process.env.HYP_API_KEY = API_KEY;
    process.env.HYP_PASSP = "1234";
    delete process.env.HYP_STRICT_VERIFY;
  });
  afterEach(() => {
    delete process.env.HYP_MASOF;
    delete process.env.HYP_API_KEY;
    delete process.env.HYP_PASSP;
  });

  it("accepts a correctly signed successful callback", async () => {
    const result = await verifyHypCallback(makeCallback());
    expect(result.ok).toBe(true);
    expect(result.ccode).toBe("0");
    expect(result.orderRef).toBe("order-ref-abc");
    expect(result.amountNis).toBe(229);
    expect(result.transactionId).toBe("12345678");
  });

  it("rejects a tampered amount", async () => {
    const params = makeCallback();
    params.set("Amount", "1");
    const result = await verifyHypCallback(params);
    expect(result.ok).toBe(false);
    expect(result.failureReason).toBe("signature_mismatch");
  });

  it("rejects a tampered order ref", async () => {
    const params = makeCallback();
    params.set("Order", "someone-elses-order");
    const result = await verifyHypCallback(params);
    expect(result.ok).toBe(false);
  });

  it("verifies signatures that include HKId (hok/recurring)", async () => {
    const result = await verifyHypCallback(makeCallback({ HKId: "777" }));
    expect(result.ok).toBe(true);
  });

  it("still verifies but reports non-zero CCode (declined transaction)", async () => {
    const result = await verifyHypCallback(makeCallback({ CCode: "6" }));
    expect(result.ok).toBe(true);
    expect(result.ccode).toBe("6");
  });

  it("reports not-configured when API key missing", async () => {
    delete process.env.HYP_API_KEY;
    const result = await verifyHypCallback(makeCallback());
    expect(result.ok).toBe(false);
    expect(result.failureReason).toBe("hyp_not_configured");
  });
});

describe("isHypConfigured", () => {
  it("requires all three env vars", () => {
    process.env.HYP_MASOF = "1";
    process.env.HYP_API_KEY = "2";
    delete process.env.HYP_PASSP;
    expect(isHypConfigured()).toBe(false);
    process.env.HYP_PASSP = "3";
    expect(isHypConfigured()).toBe(true);
    delete process.env.HYP_MASOF;
    delete process.env.HYP_API_KEY;
    delete process.env.HYP_PASSP;
  });
});
