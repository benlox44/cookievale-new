import { Inject, Injectable } from "@nestjs/common";

import { type AvailabilitySlot } from "../../domain/entities/availability-slot";
import { PastDateException } from "../../domain/exceptions/past-date.exception";
import {
  SLOT_REPOSITORY,
  type SlotRepository,
} from "../../domain/repositories/slot-repository";
import { CLOCK, type Clock } from "../../domain/services/clock";

@Injectable()
export class AddSlotUseCase {
  constructor(
    @Inject(SLOT_REPOSITORY) private readonly repo: SlotRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(date: string): Promise<AvailabilitySlot> {
    // `YYYY-MM-DD` strings compare chronologically.
    if (date < this.clock.today()) {
      throw new PastDateException();
    }
    return this.repo.insert(date);
  }
}
