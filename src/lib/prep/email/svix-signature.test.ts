import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySvixSignature } from "./svix-signature";

const KEY = Buffer.from("unit-test-signing-key");
const SECRET = `whsec_${KEY.toString("base64")}`;
const NOW_MS = 1_800_000_000_000;
const TIMESTAMP = String(NOW_MS / 1000);
const BODY = '{"type":"email.received","data":{"email_id":"abc"}}';

function sign(body: string, timestamp = TIMESTAMP): string {
  return `v1,${createHmac("sha256", KEY).update(`msg_1.${timestamp}.${body}`).digest("base64")}`;
}

describe("verifySvixSignature", () => {
  it("accepts a correctly signed request", () => {
    expect(
      verifySvixSignature({ secret: SECRET, id: "msg_1", timestamp: TIMESTAMP, signature: sign(BODY), body: BODY, nowMs: NOW_MS }),
    ).toBe(true);
  });

  it("rejects a changed body, a missing header and a stale timestamp", () => {
    const signature = sign(BODY);
    expect(
      verifySvixSignature({ secret: SECRET, id: "msg_1", timestamp: TIMESTAMP, signature, body: `${BODY} `, nowMs: NOW_MS }),
    ).toBe(false);
    expect(
      verifySvixSignature({ secret: SECRET, id: null, timestamp: TIMESTAMP, signature, body: BODY, nowMs: NOW_MS }),
    ).toBe(false);
    const old = String(NOW_MS / 1000 - 3600);
    expect(
      verifySvixSignature({ secret: SECRET, id: "msg_1", timestamp: old, signature: sign(BODY, old), body: BODY, nowMs: NOW_MS }),
    ).toBe(false);
  });
});
