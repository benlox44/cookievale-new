import { describe, expect, it, vi } from "vitest";

import { type ProductRepository } from "../../domain/repositories/product-repository";
import { ListActiveProductsUseCase } from "./list-active-products.use-case";
import { ListProductsUseCase } from "./list-products.use-case";

describe("product listing use-cases", () => {
  it("ListProductsUseCase returns all products", async () => {
    const listAll = vi.fn().mockResolvedValue([{ id: 1 }]);
    const repo = { listAll } as unknown as ProductRepository;
    await expect(new ListProductsUseCase(repo).execute()).resolves.toEqual([
      { id: 1 },
    ]);
  });

  it("ListActiveProductsUseCase returns only active products", async () => {
    const listActive = vi.fn().mockResolvedValue([{ id: 2 }]);
    const repo = { listActive } as unknown as ProductRepository;
    await expect(
      new ListActiveProductsUseCase(repo).execute(),
    ).resolves.toEqual([{ id: 2 }]);
  });
});
