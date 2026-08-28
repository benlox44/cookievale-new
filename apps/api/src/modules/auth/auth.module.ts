import { Module } from "@nestjs/common";

import { loadConfig } from "../../shared/config/env";
import { AdminLoginUseCase } from "./application/use-cases/admin-login.use-case";
import { AUTH_CONFIG } from "./domain/services/auth-config";
import { SESSION_TOKEN_SERVICE } from "./domain/services/session-token-service";
import { AuthController } from "./infrastructure/controllers/auth.controller";
import { AdminGuard } from "./infrastructure/guards/admin.guard";
import { HmacSessionTokenService } from "./infrastructure/services/session-token.service";

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: () => {
        const config = loadConfig();
        return {
          adminPassword: config.adminPassword,
          secretKey: config.secretKey,
        };
      },
    },
    {
      provide: SESSION_TOKEN_SERVICE,
      useClass: HmacSessionTokenService,
    },
    AdminLoginUseCase,
    AdminGuard,
  ],
  /**
   * Export the guard's ports too so other modules can apply AdminGuard
   * (a controller-level guard resolves in the consuming module's context).
   */
  exports: [AdminGuard, SESSION_TOKEN_SERVICE, AUTH_CONFIG],
})
export class AuthModule {}
