import { describe, expect, it, vi } from "vitest";

import { type Product } from "../../domain/entities/product";
import { ProductNotFoundException } from "../../domain/exceptions/product-not-found.exception";
import { type ProductImageStore } from "../../domain/repositories/product-image-store";
import {
  type ProductInput,
  type ProductRepository,
} from "../../domain/repositories/product-repository";
import { UpdateProductUseCase } from "./update-product.use-case";

const input: ProductInput = {
  name: "Torta",
  description: null,
  price: 200,
  isActive: true,
};
const current: Product = {
  id: 1,
  ...input,
  imageUrls: ["/media/products/1/old.png"],
  displayOrder: 0,
};
const images = { existingImages: [], imageOrder: "[]", photos: [] };

describe("UpdateProductUseCase", () => {
  it("throws when the product does not exist", async () => {
    const reconcile = vi.fn();
    const repo = {
      getById: vi.fn().mockResolvedValue(null),
    } as unknown as ProductRepository;
    const useCase = new UpdateProductUseCase(repo, {
      reconcile,
    } as unknown as ProductImageStore);

    await expect(useCase.execute(1, input, images)).rejects.toThrow(
      ProductNotFoundException,
    );
    expect(reconcile).not.toHaveBeenCalled();
  });

  it("reconciles images, persists, then deletes the removed files", async () => {
    const updated = { ...current, price: 200 };
    const update = vi.fn().mockResolvedValue(updated);
    const deleteFiles = vi.fn().mockResolvedValue(undefined);
    const repo = {
      getById: vi.fn().mockResolvedValue(current),
      update,
    } as unknown as ProductRepository;
    const store = {
      reconcile: vi.fn().mockResolvedValue({
        finalUrls: ["/media/products/1/new.png"],
        removedUrls: ["/media/products/1/old.png"],
      }),
      deleteFiles,
    } as unknown as ProductImageStore;
    const useCase = new UpdateProductUseCase(repo, store);

    await expect(useCase.execute(1, input, images)).resolves.toBe(updated);
    expect(update).toHaveBeenCalledWith(1, input, [
      "/media/products/1/new.png",
    ]);
    expect(deleteFiles).toHaveBeenCalledWith(1, ["/media/products/1/old.png"]);
  });

  it("does not delete files when nothing was removed", async () => {
    const deleteFiles = vi.fn();
    const store = {
      reconcile: vi.fn().mockResolvedValue({ finalUrls: [], removedUrls: [] }),
      deleteFiles,
    } as unknown as ProductImageStore;
    const repo = {
      getById: vi.fn().mockResolvedValue(current),
      update: vi.fn().mockResolvedValue(current),
    } as unknown as ProductRepository;
    const useCase = new UpdateProductUseCase(repo, store);

    await useCase.execute(1, input, images);
    expect(deleteFiles).not.toHaveBeenCalled();
  });
});
