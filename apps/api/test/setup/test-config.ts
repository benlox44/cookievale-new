import { tmpdir } from "node:os";
import { join } from "node:path";

export const TEST_ADMIN_PASSWORD = "test-admin-password";
export const TEST_SECRET_KEY = "test-secret-key-0123456789abcdef";
export const TEST_MEDIA_DIR = join(tmpdir(), "cookievale-int-media");

const DEFAULT_DATABASE_URL =
  "postgresql://cookie_user:cookie_pass@db:5432/cookievale";

/** The dedicated integration database URL (`<db>_test`). Idempotent. */
export function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  if (base.endsWith("_test")) {
    return base;
  }
  return base.replace(/\/([^/?]+)(\?.*)?$/, "/$1_test$2");
}

/** Deterministic test env, set in each worker (and used by global setup). */
export function applyTestEnv(): void {
  process.env.NODE_ENV = "test";
  process.env.PORT = "8000";
  process.env.DATABASE_URL = testDatabaseUrl();
  process.env.SECRET_KEY = TEST_SECRET_KEY;
  process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
  process.env.BASE_URL = "http://localhost:8000";
  process.env.TZ = "America/Santiago";
  process.env.TRUSTED_PROXY_HOSTS = "127.0.0.1";
  process.env.CONTAINER_MEDIA_PATH = TEST_MEDIA_DIR;
  process.env.TELEGRAM_BOT_TOKEN = "test-token";
  process.env.TELEGRAM_CHAT_ID = "test-chat";
}
