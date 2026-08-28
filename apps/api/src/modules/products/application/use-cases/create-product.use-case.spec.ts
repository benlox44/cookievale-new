import { describe, expect, it, vi } from "vitest";

import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import { type Product } from "../../domain/entities/product";
import { type ProductImageStore } from "../../domain/repositories/product-image-store";
import {
  type ProductInput,
  type ProductRepository,
} from "../../domain/repositories/product-repository";
import { CreateProductUseCase } from "./create-product.use-case";

const input: ProductInput = {
  name: "Torta",
  description: null,
  price: 100,
  isActive: true,
};
const product: Product = { id: 1, ...input, imageUrls: [], displayOrder: 0 };
const photo: UploadedImage = {
  originalName: "a.png",
  mimeType: "image/png",
  buffer: Buffer.from([]),
};

describe("CreateProductUseCase", () => {
  it("creates the row and skips image handling when there are no photos", async () => {
    const save = vi.fn();
    const repo = {
      create: vi.fn().mockResolvedValue(product),
    } as unknown as ProductRepository;
    const useCase = new CreateProductUseCase(repo, {
      save,
    } as unknown as ProductImageStore);

    await expect(useCase.execute(input, [])).resolves.toBe(product);
    expect(save).not.toHaveBeenCalled();
  });

  it("saves images under the new id and writes the urls back", async () => {
    const withImages = { ...product, imageUrls: ["/media/products/1/a.png"] };
    const save = vi.fn().mockResolvedValue(["/media/products/1/a.png"]);
    const repo = {
      create: vi.fn().mockResolvedValue(product),
      setImages: vi.fn().mockResolvedValue(withImages),
    } as unknown as ProductRepository;
    const useCase = new CreateProductUseCase(repo, {
      save,
    } as unknown as ProductImageStore);

    await expect(useCase.execute(input, [photo])).resolves.toBe(withImages);
    expect(save).toHaveBeenCalledWith(1, [photo]);
  });

  it("rolls back the row and files when saving images fails", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const deleteAll = vi.fn().mockResolvedValue(undefined);
    const repo = {
      create: vi.fn().mockResolvedValue(product),
      delete: del,
    } as unknown as ProductRepository;
    const images = {
      save: vi.fn().mockRejectedValue(new Error("disk full")),
      deleteAll,
    } as unknown as ProductImageStore;
    const useCase = new CreateProductUseCase(repo, images);

    await expect(useCase.execute(input, [photo])).rejects.toThrow("disk full");
    expect(del).toHaveBeenCalledWith(1);
    expect(deleteAll).toHaveBeenCalledWith(1);
  });
});
