import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "./columns";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    imageUrls: text("image_urls")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [index("ix_products_display_order").on(table.displayOrder)],
);
