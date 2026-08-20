import { describe, expect, it } from "vitest";
import { checkServiceRoleKey } from "./service-role-check";

/** Builds an unsigned JWT carrying one role claim — enough for the offline check. */
function jwtWithRole(role: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role, iss: "supabase" })}.signature`;
}

describe("checkServiceRoleKey", () => {
  it("accepts a service_role JWT", () => {
    expect(checkServiceRoleKey(jwtWithRole("service_role"))).toEqual({ ok: true, format: "jwt" });
  });

  it("rejects the anon key — the production failure that broke checkout", () => {
    const result = checkServiceRoleKey(jwtWithRole("anon"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("not_service_role");
      expect(result.detail).toContain("anon");
    }
  });

  it("accepts the newer opaque secret key", () => {
    expect(checkServiceRoleKey("sb_secret_abc123")).toEqual({ ok: true, format: "secret" });
  });

  it("rejects a publishable key pasted into the secret variable", () => {
    const result = checkServiceRoleKey("sb_publishable_abc123");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_service_role");
  });

  it("reports a missing variable distinctly from a wrong one", () => {
    const missing = checkServiceRoleKey(undefined);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.reason).toBe("missing");
  });

  it("reports an unparsable value rather than assuming it works", () => {
    const result = checkServiceRoleKey("not-a-key");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unparsable");
  });
});
