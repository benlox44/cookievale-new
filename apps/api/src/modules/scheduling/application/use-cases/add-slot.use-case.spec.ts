import { describe, expect, it, vi } from "vitest";

import { PastDateException } from "../../domain/exceptions/past-date.exception";
import { type SlotRepository } from "../../domain/repositories/slot-repository";
import { type Clock } from "../../domain/services/clock";
import { AddSlotUseCase } from "./add-slot.use-case";

const clock: Clock = { today: () => "2026-08-27" };

describe("AddSlotUseCase", () => {
  it("inserts a slot for today or a future date", async () => {
    const insert = vi.fn().mockResolvedValue({ id: 1, date: "2026-08-27" });
    const useCase = new AddSlotUseCase(
      { insert } as unknown as SlotRepository,
      clock,
    );

    await expect(useCase.execute("2026-08-27")).resolves.toEqual({
      id: 1,
      date: "2026-08-27",
    });
    expect(insert).toHaveBeenCalledWith("2026-08-27");
  });

  it("rejects a past date without inserting", async () => {
    const insert = vi.fn();
    const useCase = new AddSlotUseCase(
      { insert } as unknown as SlotRepository,
      clock,
    );

    await expect(useCase.execute("2026-08-26")).rejects.toThrow(
      PastDateException,
    );
    expect(insert).not.toHaveBeenCalled();
  });
});
