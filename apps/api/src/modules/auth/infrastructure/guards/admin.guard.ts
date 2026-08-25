import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { SESSION_COOKIE_NAME } from "../../domain/constants/session.constants";
import { AUTH_CONFIG, type AuthConfig } from "../../domain/services/auth-config";
import {
  SESSION_TOKEN_SERVICE,
  type SessionTokenService,
} from "../../domain/services/session-token-service";

function decodeCookieValue(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function parseCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = part.slice(0, eq).trim();
    if (key === name) {
      return decodeCookieValue(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(SESSION_TOKEN_SERVICE)
    private readonly sessionTokenService: SessionTokenService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = parseCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (
      !token ||
      !this.sessionTokenService.verifyToken(
        token,
        this.config.secretKey,
        nowSeconds,
      )
    ) {
      throw new UnauthorizedException("Not authenticated");
    }

    return true;
  }
}
