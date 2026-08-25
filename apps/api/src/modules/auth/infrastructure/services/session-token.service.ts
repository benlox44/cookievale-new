import { createHmac } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { safeCompare } from "../../../../shared/security/safe-compare";
import {
  SESSION_MESSAGE_PREFIX,
  SESSION_TTL_SECONDS,
} from "../../domain/constants/session.constants";
import type { SessionTokenService } from "../../domain/services/session-token-service";

function sign(secret: string, timestamp: string): string {
  const msg = `${SESSION_MESSAGE_PREFIX}${timestamp}`;
  return createHmac("sha256", secret).update(msg).digest("hex");
}

@Injectable()
export class HmacSessionTokenService implements SessionTokenService {
  createToken(secret: string, nowSeconds: number): string {
    const timestamp = String(nowSeconds);
    return `${timestamp}:${sign(secret, timestamp)}`;
  }

  verifyToken(
    token: string,
    secret: string,
    nowSeconds: number,
    ttlSeconds: number = SESSION_TTL_SECONDS,
  ): boolean {
    const separator = token.indexOf(":");
    if (separator === -1) {
      return false;
    }

    const timestampStr = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    const timestamp = Number(timestampStr);
    if (!Number.isInteger(timestamp)) {
      return false;
    }

    if (nowSeconds - timestamp > ttlSeconds) {
      return false;
    }

    const expected = sign(secret, timestampStr);
    return safeCompare(expected, signature);
  }
}
