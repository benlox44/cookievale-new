import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
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
  MAX_ORDER_PHOTOS,
} from "../../../../shared/media/media.constants";
import {
  type MulterFile,
  toUploadedImage,
} from "../../../../shared/media/multer-file";
import { AdminGuard } from "../../../auth/infrastructure/guards/admin.guard";
import { AdminCreateOrderDto } from "../../application/dto/admin-create-order.dto";
import { ChangeStatusDto } from "../../application/dto/change-status.dto";
import { ListOrdersQueryDto } from "../../application/dto/list-orders-query.dto";
import { OrderDto, OrderListDto } from "../../application/dto/order.dto";
import { UpdateOrderDto } from "../../application/dto/update-order.dto";
import { ChangeStatusUseCase } from "../../application/use-cases/change-status.use-case";
import { CreateOrderUseCase } from "../../application/use-cases/create-order.use-case";
import { DeleteOrderUseCase } from "../../application/use-cases/delete-order.use-case";
import { GetOrderUseCase } from "../../application/use-cases/get-order.use-case";
import { ListOrdersUseCase } from "../../application/use-cases/list-orders.use-case";
import { UpdateOrderUseCase } from "../../application/use-cases/update-order.use-case";

const photosInterceptor = FilesInterceptor("photos", MAX_ORDER_PHOTOS, {
  limits: { fileSize: MAX_FILE_SIZE },
});

const NOT_AUTHENTICATED = {
  summary: "Missing admin session",
  message: "Not authenticated",
};
const NOT_FOUND = { summary: "Unknown order", message: "Order not found" };

@ApiTags("orders")
@UseGuards(AdminGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly createOrder: CreateOrderUseCase,
    private readonly updateOrder: UpdateOrderUseCase,
    private readonly changeStatus: ChangeStatusUseCase,
    private readonly deleteOrder: DeleteOrderUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: "List orders (paginated)" })
  @ApiOkResponse({ type: OrderListDto })
  @ApiErrorResponses({ unauthorized: [NOT_AUTHENTICATED] })
  list(@Query() query: ListOrdersQueryDto): Promise<OrderListDto> {
    return this.listOrders.execute(query);
  }

  @Post()
  @UseInterceptors(photosInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Create an order as admin" })
  @ApiCreatedResponse({ type: OrderDto })
  @ApiErrorResponses({
    badRequest: [{ summary: "Empty cart", message: "Cart cannot be empty" }],
    unauthorized: [NOT_AUTHENTICATED],
    conflict: [
      {
        summary: "Slot taken",
        message: "The selected slot is no longer available",
      },
    ],
  })
  create(
    @Body() body: AdminCreateOrderDto,
    @UploadedFiles() photos?: MulterFile[],
  ): Promise<OrderDto> {
    return this.createOrder.execute(body, this.toImages(photos), {
      status: body.status,
      amountPaid: body.amountPaid,
      createdByAdmin: true,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an order by id" })
  @ApiOkResponse({ type: OrderDto })
  @ApiErrorResponses({
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [NOT_FOUND],
  })
  get(@Param("id", ParseIntPipe) id: number): Promise<OrderDto> {
    return this.getOrder.execute(id);
  }

  @Put(":id")
  @UseInterceptors(photosInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Update an order" })
  @ApiOkResponse({ type: OrderDto })
  @ApiErrorResponses({
    badRequest: [{ summary: "Empty cart", message: "Cart cannot be empty" }],
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [NOT_FOUND],
    conflict: [
      {
        summary: "Slot taken",
        message: "The selected slot is no longer available",
      },
    ],
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateOrderDto,
    @UploadedFiles() photos?: MulterFile[],
  ): Promise<OrderDto> {
    return this.updateOrder.execute(id, body, {
      existingPhotos: body.existingPhotos,
      imageOrder: body.imageOrder,
      photos: this.toImages(photos),
    });
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Change an order's status" })
  @ApiOkResponse({ type: OrderDto })
  @ApiErrorResponses({
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [NOT_FOUND],
  })
  status(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: ChangeStatusDto,
  ): Promise<OrderDto> {
    return this.changeStatus.execute(id, body.status);
  }

  @Delete(":id")
  @HttpCode(200)
  @ApiOperation({ summary: "Delete an order" })
  @ApiOkResponse({ type: OperationOkDto })
  @ApiErrorResponses({
    unauthorized: [NOT_AUTHENTICATED],
    notFound: [NOT_FOUND],
  })
  async delete(@Param("id", ParseIntPipe) id: number): Promise<OperationOkDto> {
    await this.deleteOrder.execute(id);
    return new OperationOkDto();
  }

  private toImages(photos: MulterFile[] | undefined) {
    return (photos ?? []).map(toUploadedImage);
  }
}
