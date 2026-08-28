import { type NestExpressApplication } from "@nestjs/platform-express";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  agent,
  createTestApp,
  seedProduct,
  seedSlot,
  truncateAll,
} from "./app";

function order(app: NestExpressApplication, cart: string, date: string) {
  return agent(app)
    .post("/orders")
    .field("customerInstagram", "@Fan")
    .field("cartItemsJson", cart)
    .field("deliveryDate", date)
    .field("deliveryMethod", "pickup")
    .field("description", "please");
}

describe("orders (integration)", () => {
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

  it("creates an order, snapshots items and normalizes the handle", async () => {
    const productId = await seedProduct(app, { price: 1500 });
    await seedSlot(app, "2027-03-01");

    const res = await order(
      app,
      JSON.stringify([{ productId, quantity: 2 }]),
      "2027-03-01",
    );
    expect(res.status).toBe(201);
    expect(res.body.totalAmount).toBe(3000);
    expect(res.body.customerInstagram).toBe("fan");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      quantity: 2,
      unitPrice: 1500,
      productName: "Torta",
    });
  });

  it("rejects an empty cart with 400", async () => {
    await seedSlot(app, "2027-03-02");
    const res = await order(app, "[]", "2027-03-02");
    expect(res.status).toBe(400);
  });

  it("returns 409 once the date's only slot is taken", async () => {
    const productId = await seedProduct(app);
    await seedSlot(app, "2027-03-03");
    const cart = JSON.stringify([{ productId, quantity: 1 }]);

    expect((await order(app, cart, "2027-03-03")).status).toBe(201);
    expect((await order(app, cart, "2027-03-03")).status).toBe(409);
  });
});
