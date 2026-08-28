import { type AvailabilitySlot } from "../entities/availability-slot";
import { type AvailableDate } from "../entities/available-date";

export const SLOT_REPOSITORY = Symbol("SLOT_REPOSITORY");

export interface SlotRepository {
  /** Dates on/after `from` that still have a free slot, with the free count. */
  availableDates(from: string): Promise<AvailableDate[]>;
  /** Lowest-id unoccupied slot on `date`, or null when the date is full. */
  firstFreeSlotId(date: string): Promise<number | null>;
  slotIsOnDate(id: number, date: string): Promise<boolean>;
  insert(date: string): Promise<AvailabilitySlot>;
  deleteById(id: number): Promise<void>;
  /** Deletes slots before `before`; returns how many were removed. */
  deleteBefore(before: string): Promise<number>;
}
