import { describe, expect, it, vi } from "vitest";

import { type SlotRepository } from "../../domain/repositories/slot-repository";
import { RemoveSlotUseCase } from "./remove-slot.use-case";

describe("RemoveSlotUseCase", () => {
  it("deletes the slot by id", async () => {
    const deleteById = vi.fn().mockResolvedValue(undefined);
    const useCase = new RemoveSlotUseCase({
      deleteById,
    } as unknown as SlotRepository);

    await useCase.execute(7);
    expect(deleteById).toHaveBeenCalledWith(7);
  });
});
