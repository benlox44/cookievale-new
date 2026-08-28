import { describe, expect, it, vi } from "vitest";

import { type ProductRepository } from "../../domain/repositories/product-repository";
import { ReorderProductsUseCase } from "./reorder-products.use-case";

describe("ReorderProductsUseCase", () => {
  it("delegates the ordered ids to the repository", async () => {
    const reorder = vi.fn().mockResolvedValue(undefined);
    const useCase = new ReorderProductsUseCase({
      reorder,
    } as unknown as ProductRepository);

    await useCase.execute([3, 1, 2]);
    expect(reorder).toHaveBeenCalledWith([3, 1, 2]);
  });
});
