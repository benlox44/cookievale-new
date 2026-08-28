import { Inject, Injectable } from "@nestjs/common";

import { SlotUnavailableException } from "../../domain/exceptions/slot-unavailable.exception";
import {
  SLOT_REPOSITORY,
  type SlotRepository,
} from "../../domain/repositories/slot-repository";

@Injectable()
export class AssignSlotUseCase {
  constructor(@Inject(SLOT_REPOSITORY) private readonly repo: SlotRepository) {}

  /**
   * On edit, an order keeps its own slot even though that slot reads as
   * occupied (by itself); otherwise claim the first free slot on the date.
   */
  async execute(
    date: string,
    currentSlotId: number | null = null,
  ): Promise<number> {
    if (
      currentSlotId !== null &&
      (await this.repo.slotIsOnDate(currentSlotId, date))
    ) {
      return currentSlotId;
    }
    const id = await this.repo.firstFreeSlotId(date);
    if (id === null) {
      throw new SlotUnavailableException();
    }
    return id;
  }
}
