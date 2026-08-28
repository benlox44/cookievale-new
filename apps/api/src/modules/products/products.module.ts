import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CreateProductUseCase } from "./application/use-cases/create-product.use-case";
import { DeleteProductUseCase } from "./application/use-cases/delete-product.use-case";
import { GetProductUseCase } from "./application/use-cases/get-product.use-case";
import { ListActiveProductsUseCase } from "./application/use-cases/list-active-products.use-case";
import { ListProductsUseCase } from "./application/use-cases/list-products.use-case";
import { ReorderProductsUseCase } from "./application/use-cases/reorder-products.use-case";
import { UpdateProductUseCase } from "./application/use-cases/update-product.use-case";
import { PRODUCT_IMAGE_STORE } from "./domain/repositories/product-image-store";
import { PRODUCT_REPOSITORY } from "./domain/repositories/product-repository";
import { AdminProductsController } from "./infrastructure/controllers/admin-products.controller";
import { ProductsController } from "./infrastructure/controllers/products.controller";
import { DrizzleProductRepository } from "./infrastructure/repositories/drizzle-product.repository";
import { MediaProductImageStore } from "./infrastructure/services/media-product-image-store";

@Module({
  /** AuthModule provides AdminGuard for the admin controller. */
  imports: [AuthModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: DrizzleProductRepository },
    { provide: PRODUCT_IMAGE_STORE, useClass: MediaProductImageStore },
    ListProductsUseCase,
    ListActiveProductsUseCase,
    GetProductUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    ReorderProductsUseCase,
    DeleteProductUseCase,
  ],
  exports: [ListActiveProductsUseCase, GetProductUseCase],
})
export class ProductsModule {}
