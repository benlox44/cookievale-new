import { Inject, Injectable } from "@nestjs/common";

import {
  SLOT_REPOSITORY,
  type SlotRepository,
} from "../../domain/repositories/slot-repository";

@Injectable()
export class RemoveSlotUseCase {
  constructor(@Inject(SLOT_REPOSITORY) private readonly repo: SlotRepository) {}

  async execute(id: number): Promise<void> {
    await this.repo.deleteById(id);
  }
}
