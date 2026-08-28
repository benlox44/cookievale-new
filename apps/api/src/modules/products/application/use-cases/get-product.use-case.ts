import { Inject, Injectable } from "@nestjs/common";

import { type Product } from "../../domain/entities/product";
import { ProductNotFoundException } from "../../domain/exceptions/product-not-found.exception";
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
  ) {}

  async execute(id: number): Promise<Product> {
    const product = await this.repo.getById(id);
    if (product === null) {
      throw new ProductNotFoundException();
    }
    return product;
  }
}
