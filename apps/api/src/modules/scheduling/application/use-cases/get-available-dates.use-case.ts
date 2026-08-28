import { Inject, Injectable } from "@nestjs/common";

import { type AvailableDate } from "../../domain/entities/available-date";
import {
  SLOT_REPOSITORY,
  type SlotRepository,
} from "../../domain/repositories/slot-repository";
import { CLOCK, type Clock } from "../../domain/services/clock";

export interface AvailableDatesResult {
  today: string;
  dates: AvailableDate[];
}

@Injectable()
export class GetAvailableDatesUseCase {
  constructor(
    @Inject(SLOT_REPOSITORY) private readonly repo: SlotRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(): Promise<AvailableDatesResult> {
    const today = this.clock.today();
    return { today, dates: await this.repo.availableDates(today) };
  }
}
