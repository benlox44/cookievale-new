import { Inject, Injectable } from "@nestjs/common";

import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

@Injectable()
export class ReorderProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly repo: ProductRepository,
  ) {}

  async execute(orderedIds: number[]): Promise<void> {
    await this.repo.reorder(orderedIds);
  }
}
