import { describe, expect, it } from "vitest";

import { InvalidCredentialsException } from "../../domain/exceptions/invalid-credentials.exception";
import { HmacSessionTokenService } from "../../infrastructure/services/session-token.service";
import { AdminLoginUseCase } from "./admin-login.use-case";

const SECRET = "test-secret";

describe("AdminLoginUseCase", () => {
  function buildUseCase(): AdminLoginUseCase {
    return new AdminLoginUseCase(new HmacSessionTokenService(), {
      adminPassword: "correct-horse",
      secretKey: SECRET,
    });
  }

  it("returns a valid token for the correct password", () => {
    const useCase = buildUseCase();
    const token = useCase.execute("correct-horse");
    expect(token).toMatch(/^[0-9]+:[0-9a-f]{64}$/);
  });

  it("throws InvalidCredentialsException for a wrong password", () => {
    const useCase = buildUseCase();
    expect(() => useCase.execute("wrong-password")).toThrow(
      InvalidCredentialsException,
    );
  });

  it("throws InvalidCredentialsException for an empty password", () => {
    const useCase = buildUseCase();
    expect(() => useCase.execute("")).toThrow(InvalidCredentialsException);
  });
});
