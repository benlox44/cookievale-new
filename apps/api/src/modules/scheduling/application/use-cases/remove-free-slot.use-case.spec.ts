import { describe, expect, it, vi } from "vitest";

import { SlotUnavailableException } from "../../domain/exceptions/slot-unavailable.exception";
import { type SlotRepository } from "../../domain/repositories/slot-repository";
import { RemoveFreeSlotUseCase } from "./remove-free-slot.use-case";

describe("RemoveFreeSlotUseCase", () => {
  it("deletes the first free slot on the date", async () => {
    const deleteById = vi.fn().mockResolvedValue(undefined);
    const useCase = new RemoveFreeSlotUseCase({
      firstFreeSlotId: vi.fn().mockResolvedValue(3),
      deleteById,
    } as unknown as SlotRepository);

    await useCase.execute("2026-08-27");
    expect(deleteById).toHaveBeenCalledWith(3);
  });

  it("throws and deletes nothing when the date has no free slot", async () => {
    const deleteById = vi.fn();
    const useCase = new RemoveFreeSlotUseCase({
      firstFreeSlotId: vi.fn().mockResolvedValue(null),
      deleteById,
    } as unknown as SlotRepository);

    await expect(useCase.execute("2026-08-27")).rejects.toThrow(
      SlotUnavailableException,
    );
    expect(deleteById).not.toHaveBeenCalled();
  });
});
