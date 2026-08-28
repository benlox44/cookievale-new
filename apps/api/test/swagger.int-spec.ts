import { type NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestApp } from "./app";

// One representative route per controller — a guard that every controller is
// wired into the OpenAPI doc that `/docs` serves.
const EXPECTED_PATHS = [
  "/health", // AppController
  "/auth/login", // AuthController
  "/available-dates", // DatesController
  "/admin/dates", // AdminDatesController
  "/products", // ProductsController
  "/admin/products", // AdminProductsController
  "/orders", // OrdersController
  "/admin/orders", // AdminOrdersController
  "/admin/orders/{id}/status", // AdminOrdersController (param route)
];

describe("swagger doc (integration)", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("documents every controller in the OpenAPI paths", () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("CookieVale API").build(),
    );
    const paths = Object.keys(document.paths);
    for (const expected of EXPECTED_PATHS) {
      expect(paths).toContain(expected);
    }
  });
});
