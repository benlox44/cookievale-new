import { ORDER_STATUS } from "@cookievale/shared";
import { describe, expect, it, vi } from "vitest";

import { type Order } from "../../domain/entities/order";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import { type OrderRepository } from "../../domain/repositories/order-repository";
import { ChangeStatusUseCase } from "./change-status.use-case";

const order = {
  id: 1,
  amountPaid: 200,
  totalAmount: 1000,
  status: ORDER_STATUS.PENDING,
  availabilitySlotId: null,
  referencePhotos: [],
} as unknown as Order;

describe("ChangeStatusUseCase", () => {
  it("throws when the order does not exist", async () => {
    const repo = {
      getById: vi.fn().mockResolvedValue(null),
    } as unknown as OrderRepository;
    await expect(
      new ChangeStatusUseCase(repo).execute(1, ORDER_STATUS.PAID),
    ).rejects.toThrow(OrderNotFoundException);
  });

  it("auto-pays in full when moving to paid", async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    const repo = {
      getById: vi.fn().mockResolvedValue(order),
      update,
    } as unknown as OrderRepository;

    await new ChangeStatusUseCase(repo).execute(1, ORDER_STATUS.PAID);
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: ORDER_STATUS.PAID, amountPaid: 1000 }),
    );
  });

  it("keeps the existing paid amount for non-paid statuses", async () => {
    const update = vi.fn().mockResolvedValue({ id: 1 });
    const repo = {
      getById: vi.fn().mockResolvedValue(order),
      update,
    } as unknown as OrderRepository;

    await new ChangeStatusUseCase(repo).execute(1, ORDER_STATUS.CONFIRMED);
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: ORDER_STATUS.CONFIRMED,
        amountPaid: 200,
      }),
    );
  });
});
