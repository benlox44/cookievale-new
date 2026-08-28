import { Inject, Injectable } from "@nestjs/common";

import { type Product } from "../../domain/entities/product";
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

@Injectable()
export class ListActiveProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
  ) {}

  execute(): Promise<Product[]> {
    return this.repo.listActive();
  }
}
