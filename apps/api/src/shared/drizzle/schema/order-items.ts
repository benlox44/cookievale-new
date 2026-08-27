import { index, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { orders } from "./orders";
import { products } from "./products";

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /**
     * Nullable + SET NULL: name and price are snapshotted below, so a product
     * can be retired without corrupting order history.
     */
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    productName: varchar("product_name", { length: 100 }).notNull(),
    ...timestamps,
  },
  (table) => [index("ix_order_items_order_id").on(table.orderId)],
);
