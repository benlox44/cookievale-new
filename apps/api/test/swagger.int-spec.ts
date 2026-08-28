import { type NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestApp } from "./app";

/** One representative route per controller — a guard that every controller is
 * wired into the OpenAPI doc that `/docs` serves. */
const EXPECTED_PATHS = [
  "/health",
  "/auth/login",
  "/available-dates",
  "/admin/dates",
  "/products",
  "/admin/products",
  "/orders",
  "/admin/orders",
  "/admin/orders/{id}/status",
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
