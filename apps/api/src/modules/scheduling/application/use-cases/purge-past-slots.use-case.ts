import { Inject, Injectable } from "@nestjs/common";

import {
  SLOT_REPOSITORY,
  type SlotRepository,
} from "../../domain/repositories/slot-repository";
import { CLOCK, type Clock } from "../../domain/services/clock";

@Injectable()
export class PurgePastSlotsUseCase {
  constructor(
    @Inject(SLOT_REPOSITORY) private readonly repo: SlotRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(): Promise<number> {
    return this.repo.deleteBefore(this.clock.today());
  }
}
