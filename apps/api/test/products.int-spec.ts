import { type NestExpressApplication } from "@nestjs/platform-express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { agent, createTestApp, login, truncateAll } from "./app";

describe("products (integration)", () => {
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

  it("round-trips an admin create → public list → get → delete", async () => {
    const cookie = await login(app);

    const created = await agent(app)
      .post("/admin/products")
      .set("Cookie", cookie)
      .field("name", "Torta")
      .field("price", "2500")
      .field("description", "rica")
      .field("isActive", "true");
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      name: "Torta",
      price: 2500,
      isActive: true,
      imageUrls: [],
    });
    const id: number = created.body.id;

    const listed = await agent(app).get("/products");
    expect(listed.body).toHaveLength(1);

    const got = await agent(app)
      .get(`/admin/products/${String(id)}`)
      .set("Cookie", cookie);
    expect(got.status).toBe(200);
    expect(got.body.name).toBe("Torta");

    const deleted = await agent(app)
      .delete(`/admin/products/${String(id)}`)
      .set("Cookie", cookie);
    expect(deleted.status).toBe(200);
    expect((await agent(app).get("/products")).body).toHaveLength(0);
  });

  it("rejects a non-positive price with 400", async () => {
    const cookie = await login(app);
    const res = await agent(app)
      .post("/admin/products")
      .set("Cookie", cookie)
      .field("name", "X")
      .field("price", "0")
      .field("isActive", "true");
    expect(res.status).toBe(400);
  });
});
