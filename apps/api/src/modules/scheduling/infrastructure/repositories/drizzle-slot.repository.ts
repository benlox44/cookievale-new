import { Injectable } from "@nestjs/common";
import { and, count, eq, gte, lt, notExists, sql } from "drizzle-orm";

import { DrizzleService } from "../../../../shared/drizzle/drizzle.service";
import { availabilitySlots, orders } from "../../../../shared/drizzle/schema";
import { type AvailabilitySlot } from "../../domain/entities/availability-slot";
import { type AvailableDate } from "../../domain/entities/available-date";
import { type SlotRepository } from "../../domain/repositories/slot-repository";

@Injectable()
export class DrizzleSlotRepository implements SlotRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db(): DrizzleService["db"] {
    return this.drizzle.db;
  }

  /** A slot is occupied iff some order still references it. */
  private unoccupied() {
    return notExists(
      this.db
        .select({ one: sql`1` })
        .from(orders)
        .where(eq(orders.availabilitySlotId, availabilitySlots.id)),
    );
  }

  async availableDates(from: string): Promise<AvailableDate[]> {
    return this.db
      .select({ date: availabilitySlots.date, freeSlots: count() })
      .from(availabilitySlots)
      .where(and(gte(availabilitySlots.date, from), this.unoccupied()))
      .groupBy(availabilitySlots.date)
      .orderBy(availabilitySlots.date);
  }

  async firstFreeSlotId(date: string): Promise<number | null> {
    const rows = await this.db
      .select({ id: availabilitySlots.id })
      .from(availabilitySlots)
      .where(and(eq(availabilitySlots.date, date), this.unoccupied()))
      .orderBy(availabilitySlots.id)
      .limit(1);
    return rows[0]?.id ?? null;
  }

  async slotIsOnDate(id: number, date: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: availabilitySlots.id })
      .from(availabilitySlots)
      .where(
        and(eq(availabilitySlots.id, id), eq(availabilitySlots.date, date)),
      )
      .limit(1);
    return rows.length > 0;
  }

  async insert(date: string): Promise<AvailabilitySlot> {
    const [slot] = await this.db
      .insert(availabilitySlots)
      .values({ date })
      .returning({ id: availabilitySlots.id, date: availabilitySlots.date });
    return slot;
  }

  async deleteById(id: number): Promise<void> {
    await this.db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
  }

  async deleteBefore(before: string): Promise<number> {
    const deleted = await this.db
      .delete(availabilitySlots)
      .where(lt(availabilitySlots.date, before))
      .returning({ id: availabilitySlots.id });
    return deleted.length;
  }
}
