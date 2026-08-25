import { describe, expect, it } from "vitest";

import { HmacSessionTokenService } from "./session-token.service";

const SECRET = "test-secret";
const service = new HmacSessionTokenService();

describe("HmacSessionTokenService.createToken", () => {
  it("produces a token with the expected timestamp and signature format", () => {
    const token = service.createToken(SECRET, 1_700_000_000);
    expect(token).toMatch(/^1700000000:[0-9a-f]{64}$/);
  });

  it("produces different tokens for different timestamps", () => {
    const a = service.createToken(SECRET, 1_700_000_000);
    const b = service.createToken(SECRET, 1_700_000_001);
    expect(a).not.toBe(b);
  });
});

describe("HmacSessionTokenService.verifyToken", () => {
  it("accepts a freshly created valid token", () => {
    const token = service.createToken(SECRET, 1_700_000_000);
    expect(service.verifyToken(token, SECRET, 1_700_000_000)).toBe(true);
  });

  it("accepts a valid token within the ttl window", () => {
    const token = service.createToken(SECRET, 1_700_000_000);
    expect(service.verifyToken(token, SECRET, 1_700_000_000 + 3600)).toBe(true);
  });

  it("rejects an expired token", () => {
    const token = service.createToken(SECRET, 1_700_000_000);
    const ttl = 8 * 60 * 60;
    expect(service.verifyToken(token, SECRET, 1_700_000_000 + ttl + 1)).toBe(
      false,
    );
  });

  it("rejects a token signed with a different secret", () => {
    const token = service.createToken("other-secret", 1_700_000_000);
    expect(service.verifyToken(token, SECRET, 1_700_000_000)).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const token = service.createToken(SECRET, 1_700_000_000);
    const tampered = `${token.slice(0, -1)}0`;
    expect(service.verifyToken(tampered, SECRET, 1_700_000_000)).toBe(false);
  });

  it("rejects a token with a non-numeric timestamp", () => {
    expect(service.verifyToken("abc:deadbeef", SECRET, 1_700_000_000)).toBe(
      false,
    );
  });

  it("rejects a malformed token without a separator", () => {
    expect(service.verifyToken("malformed", SECRET, 1_700_000_000)).toBe(false);
  });
});
