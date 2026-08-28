import { Inject, Injectable } from "@nestjs/common";

import { ProductInUseException } from "../../domain/exceptions/product-in-use.exception";
import { ProductNotFoundException } from "../../domain/exceptions/product-not-found.exception";
import {
  PRODUCT_IMAGE_STORE,
  type ProductImageStore,
} from "../../domain/repositories/product-image-store";
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
    @Inject(PRODUCT_IMAGE_STORE) private readonly images: ProductImageStore,
  ) {}

  async execute(id: number): Promise<void> {
    const product = await this.repo.getById(id);
    if (product === null) {
      throw new ProductNotFoundException();
    }
    if (await this.repo.isReferencedByOrder(id)) {
      throw new ProductInUseException();
    }
    await this.repo.delete(id);
    await this.images.deleteAll(id);
  }
}
