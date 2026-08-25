export const SESSION_TOKEN_SERVICE = Symbol("SESSION_TOKEN_SERVICE");

export interface SessionTokenService {
  createToken(secret: string, nowSeconds: number): string;
  verifyToken(
    token: string,
    secret: string,
    nowSeconds: number,
    ttlSeconds?: number,
  ): boolean;
}
