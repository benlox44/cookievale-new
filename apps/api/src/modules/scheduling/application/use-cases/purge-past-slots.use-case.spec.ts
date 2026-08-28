import { describe, expect, it, vi } from "vitest";

import { type SlotRepository } from "../../domain/repositories/slot-repository";
import { type Clock } from "../../domain/services/clock";
import { PurgePastSlotsUseCase } from "./purge-past-slots.use-case";

describe("PurgePastSlotsUseCase", () => {
  it("deletes slots before today and returns the count", async () => {
    const clock: Clock = { today: () => "2026-08-27" };
    const deleteBefore = vi.fn().mockResolvedValue(4);
    const useCase = new PurgePastSlotsUseCase(
      { deleteBefore } as unknown as SlotRepository,
      clock,
    );

    await expect(useCase.execute()).resolves.toBe(4);
    expect(deleteBefore).toHaveBeenCalledWith("2026-08-27");
  });
});
