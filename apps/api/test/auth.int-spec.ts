import { type NestExpressApplication } from "@nestjs/platform-express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { agent, createTestApp, login, truncateAll } from "./app";
import { TEST_ADMIN_PASSWORD } from "./setup/test-config";

describe("auth (integration)", () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await truncateAll(app);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await agent(app).post("/auth/login").send({ password: "nope" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty password with 400 (validation)", async () => {
    const res = await agent(app).post("/auth/login").send({ password: "" });
    expect(res.status).toBe(400);
  });

  it("logs in and sets a session cookie", async () => {
    const res = await agent(app)
      .post("/auth/login")
      .send({ password: TEST_ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("guards admin routes by the session cookie", async () => {
    expect((await agent(app).get("/admin/products")).status).toBe(401);
    const cookie = await login(app);
    expect(
      (await agent(app).get("/admin/products").set("Cookie", cookie)).status,
    ).toBe(200);
  });
});
