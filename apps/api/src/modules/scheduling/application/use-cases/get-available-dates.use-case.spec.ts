import { describe, expect, it, vi } from "vitest";

import { type SlotRepository } from "../../domain/repositories/slot-repository";
import { type Clock } from "../../domain/services/clock";
import { GetAvailableDatesUseCase } from "./get-available-dates.use-case";

describe("GetAvailableDatesUseCase", () => {
  it("returns today plus the repository's available dates", async () => {
    const clock: Clock = { today: () => "2026-08-27" };
    const dates = [{ date: "2026-08-28", freeSlots: 2 }];
    const availableDates = vi.fn().mockResolvedValue(dates);
    const useCase = new GetAvailableDatesUseCase(
      { availableDates } as unknown as SlotRepository,
      clock,
    );

    await expect(useCase.execute()).resolves.toEqual({
      today: "2026-08-27",
      dates,
    });
    expect(availableDates).toHaveBeenCalledWith("2026-08-27");
  });
});
