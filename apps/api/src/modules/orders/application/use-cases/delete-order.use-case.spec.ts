import { describe, expect, it, vi } from "vitest";

import { RemoveSlotUseCase } from "../../../scheduling/application/use-cases/remove-slot.use-case";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import { type OrderImageStore } from "../../domain/repositories/order-image-store";
import { type OrderRepository } from "../../domain/repositories/order-repository";
import { DeleteOrderUseCase } from "./delete-order.use-case";

describe("DeleteOrderUseCase", () => {
  it("throws when the order does not exist", async () => {
    const useCase = new DeleteOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue(null),
      } as unknown as OrderRepository,
      {} as OrderImageStore,
      {} as RemoveSlotUseCase,
    );
    await expect(useCase.execute(1)).rejects.toThrow(OrderNotFoundException);
  });

  it("deletes the order + media and frees its slot", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const deleteAll = vi.fn().mockResolvedValue(undefined);
    const removeSlot = vi.fn().mockResolvedValue(undefined);
    const useCase = new DeleteOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue({ id: 1, availabilitySlotId: 5 }),
        delete: del,
      } as unknown as OrderRepository,
      { deleteAll } as unknown as OrderImageStore,
      { execute: removeSlot } as unknown as RemoveSlotUseCase,
    );

    await useCase.execute(1);
    expect(del).toHaveBeenCalledWith(1);
    expect(deleteAll).toHaveBeenCalledWith(1);
    expect(removeSlot).toHaveBeenCalledWith(5);
  });

  it("skips freeing the slot when the order has none", async () => {
    const removeSlot = vi.fn();
    const useCase = new DeleteOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue({ id: 1, availabilitySlotId: null }),
        delete: vi.fn().mockResolvedValue(undefined),
      } as unknown as OrderRepository,
      {
        deleteAll: vi.fn().mockResolvedValue(undefined),
      } as unknown as OrderImageStore,
      { execute: removeSlot } as unknown as RemoveSlotUseCase,
    );

    await useCase.execute(1);
    expect(removeSlot).not.toHaveBeenCalled();
  });
});
