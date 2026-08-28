import { type NestExpressApplication } from "@nestjs/platform-express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { agent, createTestApp } from "./app";

describe("health (integration)", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports the database as connected against the real test DB", async () => {
    const res = await agent(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "connected" });
  });
});
