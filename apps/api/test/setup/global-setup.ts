import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { TEST_MEDIA_DIR, testDatabaseUrl } from "./test-config";

const here = __dirname;
const DEFAULT_DATABASE_URL =
  "postgresql://cookie_user:cookie_pass@db:5432/cookievale";

/** Once per run: (re)create the `<db>_test` database and migrate it. */
export async function setup(): Promise<void> {
  const adminUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  const testUrl = testDatabaseUrl();
  const testDbName = new URL(testUrl).pathname.slice(1);

  const admin = postgres(adminUrl, { max: 1 });
  await admin.unsafe(`DROP DATABASE IF EXISTS "${testDbName}" WITH (FORCE)`);
  await admin.unsafe(`CREATE DATABASE "${testDbName}"`);
  await admin.end();

  const client = postgres(testUrl, { max: 1 });
  await migrate(drizzle(client), {
    migrationsFolder: join(here, "../../drizzle/migrations"),
  });
  await client.end();

  rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
  mkdirSync(TEST_MEDIA_DIR, { recursive: true });
}

export function teardown(): void {
  rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
}
