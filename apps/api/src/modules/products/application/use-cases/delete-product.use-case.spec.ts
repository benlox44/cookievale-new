import { describe, expect, it, vi } from "vitest";

import { type Product } from "../../domain/entities/product";
import { ProductInUseException } from "../../domain/exceptions/product-in-use.exception";
import { ProductNotFoundException } from "../../domain/exceptions/product-not-found.exception";
import { type ProductImageStore } from "../../domain/repositories/product-image-store";
import { type ProductRepository } from "../../domain/repositories/product-repository";
import { DeleteProductUseCase } from "./delete-product.use-case";

const product: Product = {
  id: 1,
  name: "Torta",
  description: null,
  price: 100,
  imageUrls: [],
  isActive: true,
  displayOrder: 0,
};

describe("DeleteProductUseCase", () => {
  it("throws when the product does not exist", async () => {
    const repo = {
      getById: vi.fn().mockResolvedValue(null),
    } as unknown as ProductRepository;
    const useCase = new DeleteProductUseCase(repo, {} as ProductImageStore);

    await expect(useCase.execute(1)).rejects.toThrow(ProductNotFoundException);
  });

  it("refuses to delete a product referenced by an order", async () => {
    const del = vi.fn();
    const repo = {
      getById: vi.fn().mockResolvedValue(product),
      isReferencedByOrder: vi.fn().mockResolvedValue(true),
      delete: del,
    } as unknown as ProductRepository;
    const useCase = new DeleteProductUseCase(repo, {} as ProductImageStore);

    await expect(useCase.execute(1)).rejects.toThrow(ProductInUseException);
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes the row and its media when unreferenced", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const deleteAll = vi.fn().mockResolvedValue(undefined);
    const repo = {
      getById: vi.fn().mockResolvedValue(product),
      isReferencedByOrder: vi.fn().mockResolvedValue(false),
      delete: del,
    } as unknown as ProductRepository;
    const useCase = new DeleteProductUseCase(repo, {
      deleteAll,
    } as unknown as ProductImageStore);

    await useCase.execute(1);
    expect(del).toHaveBeenCalledWith(1);
    expect(deleteAll).toHaveBeenCalledWith(1);
  });
});
