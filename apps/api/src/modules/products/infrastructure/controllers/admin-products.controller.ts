import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { ApiErrorResponses } from "../../../../shared/http/api-error-responses.decorator";
import { OperationOkDto } from "../../../../shared/http/operation-ok.dto";
import {
  MAX_FILE_SIZE,
  MAX_PRODUCT_IMAGES,
} from "../../../../shared/media/media.constants";
import {
  type MulterFile,
  toUploadedImage,
} from "../../../../shared/media/multer-file";
import { AdminGuard } from "../../../auth/infrastructure/guards/admin.guard";
import { CreateProductDto } from "../../application/dto/create-product.dto";
import { ProductDto } from "../../application/dto/product.dto";
import { ReorderProductsDto } from "../../application/dto/reorder-products.dto";
import { UpdateProductDto } from "../../application/dto/update-product.dto";
import { CreateProductUseCase } from "../../application/use-cases/create-product.use-case";
import { DeleteProductUseCase } from "../../application/use-cases/delete-product.use-case";
import { GetProductUseCase } from "../../application/use-cases/get-product.use-case";
import { ListProductsUseCase } from "../../application/use-cases/list-products.use-case";
import { ReorderProductsUseCase } from "../../application/use-cases/reorder-products.use-case";
import { UpdateProductUseCase } from "../../application/use-cases/update-product.use-case";
import { type ProductInput } from "../../domain/repositories/product-repository";

const photosInterceptor = FilesInterceptor("photos", MAX_PRODUCT_IMAGES, {
  limits: { fileSize: MAX_FILE_SIZE },
});

const NOT_AUTHENTICATED = {
  summary: "Missing admin session",
  message: "Not authenticated",
};

@ApiTags("products")
@UseGuards(AdminGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly createProduct: CreateProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly reorderProducts: ReorderProductsUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all products (admin)" })
  @ApiOkResponse({ type: [ProductDto] })
  @ApiErrorResponses({ unauthorized: [NOT_AUTHENTICATED] })
  list(): Promise<ProductDto[]> {
    return this.listProducts.execute();
  }

  @Post("reorder")
  @HttpCode(200)
  @ApiOperation({ summary: "Reorder products by their ids" })
  @ApiOkResponse({ type: OperationOkDto })
  @ApiErrorResponses({
    badRequest: [
      { summary: "Empty order", message: "orderedIds should not be empty" },
    ],
    unauthorized: [NOT_AUTHENTICATED],
  })
  async reorder(@Body() body: ReorderProductsDto): Promise<OperationOkDto> {
    await this.reorderProducts.execute(body.orderedIds);
    return new OperationOkDto();
  }

  @Post()
  @UseInterceptors(photosInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Create a product" })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiErrorResponses({
    badRequest: [
      { summary: "Invalid fields", message: "price must not be less than 1" },
    ],
    unauthorized: [NOT_AUTHENTICATED],
  })
  create(
    @Body() body: CreateProductDto,
    @UploadedFiles() photos?: MulterFile[],
  ): Promise<ProductDto> {
    return this.createProduct.execute(
      this.toInput(body),
      this.toImages(photos),
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a product by id" })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrorResponses({
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [{ summary: "Unknown product", message: "Product not found" }],
  })
  get(@Param("id", ParseIntPipe) id: number): Promise<ProductDto> {
    return this.getProduct.execute(id);
  }

  @Put(":id")
  @UseInterceptors(photosInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Update a product" })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrorResponses({
    badRequest: [
      { summary: "Invalid fields", message: "price must not be less than 1" },
    ],
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [{ summary: "Unknown product", message: "Product not found" }],
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateProductDto,
    @UploadedFiles() photos?: MulterFile[],
  ): Promise<ProductDto> {
    return this.updateProduct.execute(id, this.toInput(body), {
      existingImages: body.existingImages,
      imageOrder: body.imageOrder,
      photos: this.toImages(photos),
    });
  }

  @Delete(":id")
  @HttpCode(200)
  @ApiOperation({ summary: "Delete a product" })
  @ApiOkResponse({ type: OperationOkDto })
  @ApiErrorResponses({
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [{ summary: "Unknown product", message: "Product not found" }],
    conflict: [
      {
        summary: "Product has orders",
        message: "Cannot delete a product that has orders",
      },
    ],
  })
  async delete(@Param("id", ParseIntPipe) id: number): Promise<OperationOkDto> {
    await this.deleteProduct.execute(id);
    return new OperationOkDto();
  }

  private toInput(body: CreateProductDto): ProductInput {
    return {
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      isActive: body.isActive,
    };
  }

  private toImages(photos: MulterFile[] | undefined) {
    return (photos ?? []).map(toUploadedImage);
  }
}
