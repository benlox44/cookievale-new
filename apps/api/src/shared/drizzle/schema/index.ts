import { availabilitySlots } from "./availability-slots";
import { orderItems } from "./order-items";
import { orders } from "./orders";
import { products } from "./products";

export * from "./availability-slots";
export * from "./enums";
export * from "./order-items";
export * from "./orders";
export * from "./products";

/** Passed to the drizzle client so `db.query.*` is typed. Tables only. */
export const schema = {
  availabilitySlots,
  products,
  orders,
  orderItems,
};
