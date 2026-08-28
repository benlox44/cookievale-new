import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { ApiErrorResponses } from "../../../../shared/http/api-error-responses.decorator";
import {
  MAX_FILE_SIZE,
  MAX_ORDER_PHOTOS,
} from "../../../../shared/media/media.constants";
import {
  type MulterFile,
  toUploadedImage,
} from "../../../../shared/media/multer-file";
import { CreateOrderDto } from "../../application/dto/create-order.dto";
import { OrderDto } from "../../application/dto/order.dto";
import { CreateOrderUseCase } from "../../application/use-cases/create-order.use-case";

const photosInterceptor = FilesInterceptor("photos", MAX_ORDER_PHOTOS, {
  limits: { fileSize: MAX_FILE_SIZE },
});

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly createOrder: CreateOrderUseCase) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  @UseInterceptors(photosInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Place an order" })
  @ApiCreatedResponse({ type: OrderDto, description: "Order created" })
  @ApiErrorResponses({
    badRequest: [{ summary: "Empty cart", message: "Cart cannot be empty" }],
    conflict: [
      {
        summary: "Slot taken",
        message: "The selected slot is no longer available",
      },
    ],
    tooManyRequests: [
      { summary: "Order rate limit exceeded", message: "Rate limit exceeded" },
    ],
  })
  create(
    @Body() body: CreateOrderDto,
    @UploadedFiles() photos?: MulterFile[],
  ): Promise<OrderDto> {
    return this.createOrder.execute(body, (photos ?? []).map(toUploadedImage));
  }
}
