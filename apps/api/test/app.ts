import { type NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { loadConfig } from "../src/shared/config/env";
import { DrizzleService } from "../src/shared/drizzle/drizzle.service";
import { availabilitySlots, products } from "../src/shared/drizzle/schema";
import { TELEGRAM_NOTIFIER } from "../src/shared/telegram/telegram-notifier";
import { TEST_ADMIN_PASSWORD } from "./setup/test-config";

/** Boot the full app against the test DB, with Telegram stubbed to a no-op. */
export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(TELEGRAM_NOTIFIER)
    .useValue({ sendMessage: () => Promise.resolve() })
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app, loadConfig());
  await app.init();
  return app;
}

export function agent(app: NestExpressApplication) {
  return request(app.getHttpServer());
}

export async function truncateAll(app: NestExpressApplication): Promise<void> {
  await app
    .get(DrizzleService)
    .db.execute(
      sql`TRUNCATE order_items, orders, products, availability_slots RESTART IDENTITY CASCADE`,
    );
}

/** Log in as admin and return the `admin_session` cookie for authed requests. */
export async function login(app: NestExpressApplication): Promise<string> {
  const res = await agent(app)
    .post("/auth/login")
    .send({ password: TEST_ADMIN_PASSWORD });
  const cookies = res.headers["set-cookie"] as unknown as string[];
  return cookies[0].split(";")[0];
}

export async function seedProduct(
  app: NestExpressApplication,
  overrides: { name?: string; price?: number; isActive?: boolean } = {},
): Promise<number> {
  const [row] = await app
    .get(DrizzleService)
    .db.insert(products)
    .values({
      name: overrides.name ?? "Torta",
      price: overrides.price ?? 1000,
      isActive: overrides.isActive ?? true,
    })
    .returning({ id: products.id });
  return row.id;
}

export async function seedSlot(
  app: NestExpressApplication,
  date: string,
): Promise<number> {
  const [row] = await app
    .get(DrizzleService)
    .db.insert(availabilitySlots)
    .values({ date })
    .returning({ id: availabilitySlots.id });
  return row.id;
}
