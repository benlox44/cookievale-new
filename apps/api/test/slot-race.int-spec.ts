import { type NestExpressApplication } from "@nestjs/platform-express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  agent,
  createTestApp,
  seedProduct,
  seedSlot,
  truncateAll,
} from "./app";

describe("slot race (integration)", () => {
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

  it("lets only one of two concurrent orders claim the same slot", async () => {
    const productId = await seedProduct(app);
    await seedSlot(app, "2027-04-01");
    const cart = JSON.stringify([{ productId, quantity: 1 }]);

    const place = () =>
      agent(app)
        .post("/orders")
        .field("customerInstagram", "x")
        .field("cartItemsJson", cart)
        .field("deliveryDate", "2027-04-01")
        .field("deliveryMethod", "pickup")
        .field("description", "d");

    const [a, b] = await Promise.all([place(), place()]);
    // One wins the unique index; the other loses (409), whichever order they land.
    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });
});
