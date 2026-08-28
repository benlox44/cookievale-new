import { Inject, Injectable } from "@nestjs/common";

import { SlotUnavailableException } from "../../domain/exceptions/slot-unavailable.exception";
import {
  SLOT_REPOSITORY,
  type SlotRepository,
} from "../../domain/repositories/slot-repository";

@Injectable()
export class RemoveFreeSlotUseCase {
  constructor(@Inject(SLOT_REPOSITORY) private readonly repo: SlotRepository) {}

  async execute(date: string): Promise<void> {
    const id = await this.repo.firstFreeSlotId(date);
    if (id === null) {
      throw new SlotUnavailableException(
        "No free slot to remove for that date",
      );
    }
    await this.repo.deleteById(id);
  }
}
