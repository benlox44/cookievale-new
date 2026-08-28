import { describe, expect, it, vi } from "vitest";

import { SlotUnavailableException } from "../../domain/exceptions/slot-unavailable.exception";
import { type SlotRepository } from "../../domain/repositories/slot-repository";
import { AssignSlotUseCase } from "./assign-slot.use-case";

describe("AssignSlotUseCase", () => {
  it("keeps the order's own slot when it is on the target date", async () => {
    const firstFreeSlotId = vi.fn();
    const useCase = new AssignSlotUseCase({
      slotIsOnDate: vi.fn().mockResolvedValue(true),
      firstFreeSlotId,
    } as unknown as SlotRepository);

    await expect(useCase.execute("2026-08-27", 42)).resolves.toBe(42);
    expect(firstFreeSlotId).not.toHaveBeenCalled();
  });

  it("claims the first free slot when there is no current slot", async () => {
    const useCase = new AssignSlotUseCase({
      slotIsOnDate: vi.fn().mockResolvedValue(false),
      firstFreeSlotId: vi.fn().mockResolvedValue(5),
    } as unknown as SlotRepository);

    await expect(useCase.execute("2026-08-27")).resolves.toBe(5);
  });

  it("throws when the date has no free slot", async () => {
    const useCase = new AssignSlotUseCase({
      slotIsOnDate: vi.fn().mockResolvedValue(false),
      firstFreeSlotId: vi.fn().mockResolvedValue(null),
    } as unknown as SlotRepository);

    await expect(useCase.execute("2026-08-27", 42)).rejects.toThrow(
      SlotUnavailableException,
    );
  });
});
