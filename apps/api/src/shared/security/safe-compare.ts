import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison. Guards secret checks (session tokens,
 * passwords) against timing attacks — never replace with `===`.
 */
export function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}
