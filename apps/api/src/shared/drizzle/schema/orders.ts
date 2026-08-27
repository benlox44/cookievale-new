import { DELIVERY_METHOD, ORDER_STATUS } from "@cookievale/shared";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import { availabilitySlots } from "./availability-slots";
import { timestamps } from "./columns";
import { deliveryMethodEnum, orderStatusEnum } from "./enums";

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    customerInstagram: varchar("customer_instagram", { length: 30 }).notNull(),
    /** Naive wall-clock time in the shop's timezone (parity with legacy). */
    deliveryDate: timestamp("delivery_date").notNull(),
    availabilitySlotId: integer("availability_slot_id").references(
      () => availabilitySlots.id,
      { onDelete: "set null" },
    ),
    description: text("description").notNull(),
    deliveryMethod: deliveryMethodEnum("delivery_method")
      .notNull()
      .default(DELIVERY_METHOD.PICKUP),
    amountPaid: integer("amount_paid").notNull().default(0),
    totalAmount: integer("total_amount").notNull().default(0),
    referencePhotos: text("reference_photos")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: orderStatusEnum("status").notNull().default(ORDER_STATUS.PENDING),
    ...timestamps,
  },
  (table) => [
    /**
     * At most one order per slot (NULLs are exempt, so many unslotted orders
     * are allowed) — the concurrency guard against double-booking.
     */
    uniqueIndex("uq_orders_availability_slot_active").on(
      table.availabilitySlotId,
    ),
    index("ix_orders_created_at").on(table.createdAt),
  ],
);
