import { timestamp } from "drizzle-orm/pg-core";

/** `updated_at` is bumped in app code ($onUpdate), not by a DB trigger. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
