import { DELIVERY_METHOD, ORDER_STATUS } from "@cookievale/shared";
import { describe, expect, it, vi } from "vitest";

import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import { AssignSlotUseCase } from "../../../scheduling/application/use-cases/assign-slot.use-case";
import { type OrderImageStore } from "../../domain/repositories/order-image-store";
import { type OrderRepository } from "../../domain/repositories/order-repository";
import { CartParser } from "../services/cart-parser";
import { CreateOrderUseCase } from "./create-order.use-case";

const cart = {
  items: [{ productId: 1, quantity: 2, unitPrice: 500, productName: "T" }],
  totalAmount: 1000,
};
const input = {
  customerInstagram: "fan",
  cartItemsJson: "[]",
  deliveryDate: "2027-01-15",
  deliveryMethod: DELIVERY_METHOD.PICKUP,
  description: "d",
};
const photo: UploadedImage = {
  originalName: "a.png",
  mimeType: "image/png",
  buffer: Buffer.from([]),
};

describe("CreateOrderUseCase", () => {
  it("parses cart, claims slot, persists, saves photos and notifies", async () => {
    const created = { id: 7, referencePhotos: [] };
    const withPhotos = { id: 7, referencePhotos: ["/media/orders/7/a.png"] };
    const create = vi.fn().mockResolvedValue(created);
    const setReferencePhotos = vi.fn().mockResolvedValue(withPhotos);
    const save = vi.fn().mockResolvedValue(["/media/orders/7/a.png"]);
    const notifyNewOrder = vi.fn().mockResolvedValue(undefined);
    const useCase = new CreateOrderUseCase(
      { create, setReferencePhotos } as unknown as OrderRepository,
      { save } as unknown as OrderImageStore,
      { notifyNewOrder },
      { parse: vi.fn().mockResolvedValue(cart) } as unknown as CartParser,
      { execute: vi.fn().mockResolvedValue(9) } as unknown as AssignSlotUseCase,
    );

    await expect(useCase.execute(input, [photo])).resolves.toBe(withPhotos);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        availabilitySlotId: 9,
        totalAmount: 1000,
        amountPaid: 0,
        status: ORDER_STATUS.PENDING,
      }),
      cart.items,
    );
    expect(save).toHaveBeenCalledWith(7, [photo]);
    expect(notifyNewOrder).toHaveBeenCalledWith(withPhotos, false);
  });

  it("skips photos and auto-pays when the admin creates it delivered", async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const save = vi.fn();
    const useCase = new CreateOrderUseCase(
      { create } as unknown as OrderRepository,
      { save } as unknown as OrderImageStore,
      { notifyNewOrder: vi.fn() },
      { parse: vi.fn().mockResolvedValue(cart) } as unknown as CartParser,
      { execute: vi.fn().mockResolvedValue(1) } as unknown as AssignSlotUseCase,
    );

    await useCase.execute(input, [], {
      status: ORDER_STATUS.DELIVERED,
      amountPaid: 0,
      createdByAdmin: true,
    });
    expect(save).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amountPaid: 1000,
        status: ORDER_STATUS.DELIVERED,
      }),
      cart.items,
    );
  });
});
