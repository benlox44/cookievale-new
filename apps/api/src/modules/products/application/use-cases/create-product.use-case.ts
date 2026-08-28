import { Inject, Injectable } from "@nestjs/common";

import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import { type Product } from "../../domain/entities/product";
import {
  PRODUCT_IMAGE_STORE,
  type ProductImageStore,
} from "../../domain/repositories/product-image-store";
import {
  PRODUCT_REPOSITORY,
  type ProductInput,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
    @Inject(PRODUCT_IMAGE_STORE) private readonly images: ProductImageStore,
  ) {}

  /**
   * Two-phase: the row is created first to obtain the id the media path needs,
   * then images are saved under it. A failed upload rolls back row and files.
   */
  async execute(data: ProductInput, photos: UploadedImage[]): Promise<Product> {
    const product = await this.repo.create(data);
    if (photos.length === 0) {
      return product;
    }
    try {
      const urls = await this.images.save(product.id, photos);
      return await this.repo.setImages(product.id, urls);
    } catch (error) {
      await this.repo.delete(product.id);
      await this.images.deleteAll(product.id);
      throw error;
    }
  }
}
