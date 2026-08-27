import { Inject, Injectable } from "@nestjs/common";

import { safeCompare } from "../../../../shared/security/safe-compare";
import { InvalidCredentialsException } from "../../domain/exceptions/invalid-credentials.exception";
import {
  AUTH_CONFIG,
  type AuthConfig,
} from "../../domain/services/auth-config";
import {
  SESSION_TOKEN_SERVICE,
  type SessionTokenService,
} from "../../domain/services/session-token-service";

@Injectable()
export class AdminLoginUseCase {
  constructor(
    @Inject(SESSION_TOKEN_SERVICE)
    private readonly sessionTokenService: SessionTokenService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  execute(password: string): string {
    if (!safeCompare(password, this.config.adminPassword)) {
      throw new InvalidCredentialsException();
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    return this.sessionTokenService.createToken(
      this.config.secretKey,
      nowSeconds,
    );
  }
}
