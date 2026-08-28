import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { ProductsModule } from "../products/products.module";
import { SchedulingModule } from "../scheduling/scheduling.module";
import { CartParser } from "./application/services/cart-parser";
import { ChangeStatusUseCase } from "./application/use-cases/change-status.use-case";
import { CreateOrderUseCase } from "./application/use-cases/create-order.use-case";
import { DeleteOrderUseCase } from "./application/use-cases/delete-order.use-case";
import { GetOrderUseCase } from "./application/use-cases/get-order.use-case";
import { ListOrdersUseCase } from "./application/use-cases/list-orders.use-case";
import { UpdateOrderUseCase } from "./application/use-cases/update-order.use-case";
import { ORDER_IMAGE_STORE } from "./domain/repositories/order-image-store";
import { ORDER_REPOSITORY } from "./domain/repositories/order-repository";
import { ORDER_NOTIFIER } from "./domain/services/order-notifier";
import { AdminOrdersController } from "./infrastructure/controllers/admin-orders.controller";
import { OrdersController } from "./infrastructure/controllers/orders.controller";
import { DrizzleOrderRepository } from "./infrastructure/repositories/drizzle-order.repository";
import { MediaOrderImageStore } from "./infrastructure/services/media-order-image-store";
import { TelegramOrderNotifier } from "./infrastructure/services/telegram-order-notifier";

@Module({
  // Scheduling: AssignSlot/RemoveSlot + CLOCK; Products: GetProduct (cart);
  // Auth: AdminGuard for the admin controller.
  imports: [AuthModule, SchedulingModule, ProductsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: DrizzleOrderRepository },
    { provide: ORDER_IMAGE_STORE, useClass: MediaOrderImageStore },
    { provide: ORDER_NOTIFIER, useClass: TelegramOrderNotifier },
    CartParser,
    CreateOrderUseCase,
    ListOrdersUseCase,
    GetOrderUseCase,
    UpdateOrderUseCase,
    ChangeStatusUseCase,
    DeleteOrderUseCase,
  ],
})
export class OrdersModule {}
