import { describe, expect, it, vi } from "vitest";

import { type Product } from "../../domain/entities/product";
import { ProductNotFoundException } from "../../domain/exceptions/product-not-found.exception";
import { type ProductRepository } from "../../domain/repositories/product-repository";
import { GetProductUseCase } from "./get-product.use-case";

const product: Product = {
  id: 1,
  name: "Torta",
  description: null,
  price: 100,
  imageUrls: [],
  isActive: true,
  displayOrder: 0,
};

describe("GetProductUseCase", () => {
  it("returns the product when it exists", async () => {
    const repo = {
      getById: vi.fn().mockResolvedValue(product),
    } as unknown as ProductRepository;
    await expect(new GetProductUseCase(repo).execute(1)).resolves.toBe(product);
  });

  it("throws when the product is missing", async () => {
    const repo = {
      getById: vi.fn().mockResolvedValue(null),
    } as unknown as ProductRepository;
    await expect(new GetProductUseCase(repo).execute(1)).rejects.toThrow(
      ProductNotFoundException,
    );
  });
});
