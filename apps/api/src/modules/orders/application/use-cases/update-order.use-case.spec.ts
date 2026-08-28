import { DELIVERY_METHOD, ORDER_STATUS } from "@cookievale/shared";
import { describe, expect, it, vi } from "vitest";

import { AssignSlotUseCase } from "../../../scheduling/application/use-cases/assign-slot.use-case";
import { SlotUnavailableException } from "../../../scheduling/domain/exceptions/slot-unavailable.exception";
import { type Clock } from "../../../scheduling/domain/services/clock";
import { type Order } from "../../domain/entities/order";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import { type OrderImageStore } from "../../domain/repositories/order-image-store";
import { type OrderRepository } from "../../domain/repositories/order-repository";
import { CartParser } from "../services/cart-parser";
import { UpdateOrderUseCase } from "./update-order.use-case";

const clock: Clock = { today: () => "2027-06-01" };
const order = {
  id: 1,
  availabilitySlotId: 5,
  totalAmount: 1000,
  referencePhotos: ["/media/orders/1/old.png"],
  items: [
    { productId: 1, quantity: 1, unitPrice: 500, productName: "Snapshot" },
  ],
} as unknown as Order;
const input = {
  deliveryDate: "2027-07-01",
  description: "edited",
  deliveryMethod: DELIVERY_METHOD.DELIVERY,
  amountPaid: 0,
  status: ORDER_STATUS.CONFIRMED,
};
const images = { existingPhotos: [], imageOrder: "[]", photos: [] };
const noReconcile = { finalUrls: [], removedUrls: [] };

describe("UpdateOrderUseCase", () => {
  it("throws when the order does not exist", async () => {
    const useCase = new UpdateOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue(null),
      } as unknown as OrderRepository,
      {} as OrderImageStore,
      clock,
      {} as CartParser,
      {} as AssignSlotUseCase,
    );
    await expect(useCase.execute(1, input, images)).rejects.toThrow(
      OrderNotFoundException,
    );
  });

  it("re-matches the slot, replaces items and deletes removed photos", async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    const deleteFiles = vi.fn().mockResolvedValue(undefined);
    const useCase = new UpdateOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue(order),
        update,
      } as unknown as OrderRepository,
      {
        reconcile: vi.fn().mockResolvedValue({
          finalUrls: ["/media/orders/1/new.png"],
          removedUrls: ["/media/orders/1/old.png"],
        }),
        deleteFiles,
      } as unknown as OrderImageStore,
      clock,
      {
        parse: vi.fn().mockResolvedValue({
          items: [
            {
              productId: 1,
              quantity: 3,
              unitPrice: 500,
              productName: "Snapshot",
            },
          ],
          totalAmount: 1500,
        }),
      } as unknown as CartParser,
      { execute: vi.fn().mockResolvedValue(5) } as unknown as AssignSlotUseCase,
    );

    await useCase.execute(1, { ...input, cartItemsJson: "[]" }, images);
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ availabilitySlotId: 5, totalAmount: 1500 }),
      [{ productId: 1, quantity: 3, unitPrice: 500, productName: "Snapshot" }],
    );
    expect(deleteFiles).toHaveBeenCalledWith(1, ["/media/orders/1/old.png"]);
  });

  it("drops the slot when moving to a past date the scheduler can't fill", async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    const useCase = new UpdateOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue(order),
        update,
      } as unknown as OrderRepository,
      {
        reconcile: vi.fn().mockResolvedValue(noReconcile),
      } as unknown as OrderImageStore,
      clock,
      {} as CartParser,
      {
        execute: vi.fn().mockRejectedValue(new SlotUnavailableException()),
      } as unknown as AssignSlotUseCase,
    );

    await useCase.execute(1, { ...input, deliveryDate: "2020-01-01" }, images);
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ availabilitySlotId: null }),
      undefined,
    );
  });

  it("rethrows when a future date is genuinely full", async () => {
    const useCase = new UpdateOrderUseCase(
      {
        getById: vi.fn().mockResolvedValue(order),
      } as unknown as OrderRepository,
      { reconcile: vi.fn() } as unknown as OrderImageStore,
      clock,
      {} as CartParser,
      {
        execute: vi.fn().mockRejectedValue(new SlotUnavailableException()),
      } as unknown as AssignSlotUseCase,
    );

    await expect(
      useCase.execute(1, { ...input, deliveryDate: "2099-01-01" }, images),
    ).rejects.toThrow(SlotUnavailableException);
  });
});
