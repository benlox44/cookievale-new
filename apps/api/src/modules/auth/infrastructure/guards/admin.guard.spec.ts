import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_COOKIE_NAME } from "../../domain/constants/session.constants";
import type { SessionTokenService } from "../../domain/services/session-token-service";
import { AdminGuard } from "./admin.guard";

function mockContext(cookieHeader: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () =>
        ({ headers: { cookie: cookieHeader } }) as unknown as Request,
    }),
  } as unknown as ExecutionContext;
}

describe("AdminGuard", () => {
  let verifyToken: ReturnType<typeof vi.fn>;

  function createGuard(secretKey = "test-secret"): AdminGuard {
    return new AdminGuard(
      { verifyToken } as unknown as SessionTokenService,
      { adminPassword: "admin", secretKey },
    );
  }

  beforeEach(() => {
    verifyToken = vi.fn();
  });

  it("allows a request with a valid session token", () => {
    verifyToken.mockReturnValue(true);
    const guard = createGuard();
    expect(guard.canActivate(mockContext(`${SESSION_COOKIE_NAME}=token`))).toBe(
      true,
    );
    expect(verifyToken).toHaveBeenCalledWith(
      "token",
      "test-secret",
      expect.any(Number),
    );
  });

  it("rejects a request without a cookie header", () => {
    const guard = createGuard();
    expect(() => guard.canActivate(mockContext(undefined))).toThrow(
      new UnauthorizedException("Not authenticated"),
    );
  });

  it("rejects a request with an invalid token", () => {
    verifyToken.mockReturnValue(false);
    const guard = createGuard();
    expect(() =>
      guard.canActivate(mockContext(`${SESSION_COOKIE_NAME}=bad`)),
    ).toThrow(new UnauthorizedException("Not authenticated"));
  });

  it("rejects a request with a cookie for a different name", () => {
    const guard = createGuard();
    expect(() => guard.canActivate(mockContext("other_session=token"))).toThrow(
      new UnauthorizedException("Not authenticated"),
    );
  });

  it("rejects a request with a malformed percent-encoded cookie value", () => {
    const guard = createGuard();
    expect(() =>
      guard.canActivate(mockContext(`${SESSION_COOKIE_NAME}=%zz`)),
    ).toThrow(new UnauthorizedException("Not authenticated"));
  });

  it("uses the injected secret key", () => {
    verifyToken.mockReturnValue(true);
    const guard = createGuard("other-secret");
    guard.canActivate(mockContext(`${SESSION_COOKIE_NAME}=token`));
    expect(verifyToken).toHaveBeenCalledWith(
      "token",
      "other-secret",
      expect.any(Number),
    );
  });
});