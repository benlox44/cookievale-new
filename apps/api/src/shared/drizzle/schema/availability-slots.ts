import { date, index, pgTable, serial } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";

/**
 * `date` is intentionally NON-unique: several slots can exist on the same day.
 * A booking's uniqueness is enforced on the orders side, not here.
 */
export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    ...timestamps,
  },
  (table) => [index("ix_availability_slots_date").on(table.date)],
);
