import { describe, expect, it, vi } from "vitest";

import { type Order } from "../../domain/entities/order";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import { type OrderRepository } from "../../domain/repositories/order-repository";
import { GetOrderUseCase } from "./get-order.use-case";
import { ListOrdersUseCase } from "./list-orders.use-case";

describe("GetOrderUseCase", () => {
  it("returns the order when found, else throws", async () => {
    const order = { id: 1 } as Order;
    const found = { getById: vi.fn().mockResolvedValue(order) };
    await expect(
      new GetOrderUseCase(found as unknown as OrderRepository).execute(1),
    ).resolves.toBe(order);

    const missing = { getById: vi.fn().mockResolvedValue(null) };
    await expect(
      new GetOrderUseCase(missing as unknown as OrderRepository).execute(1),
    ).rejects.toThrow(OrderNotFoundException);
  });
});

describe("ListOrdersUseCase", () => {
  it("paginates with page size 50 and computes total pages", async () => {
    const list = vi.fn().mockResolvedValue([{ id: 1 }]);
    const count = vi.fn().mockResolvedValue(120);
    const useCase = new ListOrdersUseCase({
      list,
      count,
    } as unknown as OrderRepository);

    const result = await useCase.execute({
      includeDelivered: false,
      page: 2,
      sortBy: "date",
      sortDir: "desc",
    });

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, offset: 50 }),
    );
    expect(result).toMatchObject({
      total: 120,
      page: 2,
      pageSize: 50,
      totalPages: 3,
    });
  });
});
