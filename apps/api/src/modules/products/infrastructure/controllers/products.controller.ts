import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ProductDto } from "../../application/dto/product.dto";
import { ListActiveProductsUseCase } from "../../application/use-cases/list-active-products.use-case";

@ApiTags("products")
@Controller()
export class ProductsController {
  constructor(private readonly listActive: ListActiveProductsUseCase) {}

  @Get("products")
  @ApiOperation({ summary: "List active products (public menu)" })
  @ApiOkResponse({
    type: [ProductDto],
    description: "Active products, ordered",
  })
  list(): Promise<ProductDto[]> {
    return this.listActive.execute();
  }
}
