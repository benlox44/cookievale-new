import { Module } from "@nestjs/common";

import { loadConfig } from "../../shared/config/env";
import { AuthModule } from "../auth/auth.module";
import { AddSlotUseCase } from "./application/use-cases/add-slot.use-case";
import { AssignSlotUseCase } from "./application/use-cases/assign-slot.use-case";
import { GetAvailableDatesUseCase } from "./application/use-cases/get-available-dates.use-case";
import { PurgePastSlotsUseCase } from "./application/use-cases/purge-past-slots.use-case";
import { RemoveFreeSlotUseCase } from "./application/use-cases/remove-free-slot.use-case";
import { RemoveSlotUseCase } from "./application/use-cases/remove-slot.use-case";
import { SLOT_REPOSITORY } from "./domain/repositories/slot-repository";
import { CLOCK } from "./domain/services/clock";
import { AdminDatesController } from "./infrastructure/controllers/admin-dates.controller";
import { DatesController } from "./infrastructure/controllers/dates.controller";
import { DrizzleSlotRepository } from "./infrastructure/repositories/drizzle-slot.repository";
import { ShopClock } from "./infrastructure/services/shop-clock";

@Module({
  /** AuthModule provides AdminGuard for the admin controller. */
  imports: [AuthModule],
  controllers: [DatesController, AdminDatesController],
  providers: [
    { provide: SLOT_REPOSITORY, useClass: DrizzleSlotRepository },
    { provide: CLOCK, useFactory: () => new ShopClock(loadConfig().timeZone) },
    GetAvailableDatesUseCase,
    AddSlotUseCase,
    RemoveFreeSlotUseCase,
    AssignSlotUseCase,
    RemoveSlotUseCase,
    PurgePastSlotsUseCase,
  ],
  exports: [
    /** orders reuses "today" for its edit past-date rule */
    CLOCK,
    AssignSlotUseCase,
    RemoveSlotUseCase,
    GetAvailableDatesUseCase,
    PurgePastSlotsUseCase,
  ],
})
export class SchedulingModule {}
