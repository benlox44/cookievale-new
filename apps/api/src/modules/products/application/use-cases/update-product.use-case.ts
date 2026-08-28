import { Inject, Injectable } from "@nestjs/common";

import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import { type Product } from "../../domain/entities/product";
import { ProductNotFoundException } from "../../domain/exceptions/product-not-found.exception";
import {
  PRODUCT_IMAGE_STORE,
  type ProductImageStore,
} from "../../domain/repositories/product-image-store";
import {
  PRODUCT_REPOSITORY,
  type ProductInput,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

export interface UpdateProductImages {
  existingImages: string[];
  imageOrder: string;
  photos: UploadedImage[];
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
    @Inject(PRODUCT_IMAGE_STORE) private readonly images: ProductImageStore,
  ) {}

  async execute(
    id: number,
    data: ProductInput,
    images: UpdateProductImages,
  ): Promise<Product> {
    const current = await this.repo.getById(id);
    if (current === null) {
      throw new ProductNotFoundException();
    }

    const { finalUrls, removedUrls } = await this.images.reconcile(
      id,
      current.imageUrls,
      images.existingImages,
      images.imageOrder,
      images.photos,
    );
    const updated = await this.repo.update(id, data, finalUrls);
    if (removedUrls.length > 0) {
      await this.images.deleteFiles(id, removedUrls);
    }
    return updated;
  }
}
