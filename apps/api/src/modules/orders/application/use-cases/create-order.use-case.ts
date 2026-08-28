import {
  type DeliveryMethod,
  ORDER_STATUS,
  type OrderStatus,
} from "@cookievale/shared";
import { Inject, Injectable } from "@nestjs/common";

import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import { AssignSlotUseCase } from "../../../scheduling/application/use-cases/assign-slot.use-case";
import { type Order } from "../../domain/entities/order";
import {
  ORDER_IMAGE_STORE,
  type OrderImageStore,
} from "../../domain/repositories/order-image-store";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/repositories/order-repository";
import {
  resolvePaidAmount,
  toDeliveryTimestamp,
} from "../../domain/services/order-amounts";
import {
  ORDER_NOTIFIER,
  type OrderNotifier,
} from "../../domain/services/order-notifier";
import { CartParser } from "../services/cart-parser";

export interface CreateOrderInput {
  customerInstagram: string;
  cartItemsJson: string;
  deliveryDate: string;
  deliveryMethod: DeliveryMethod;
  description: string;
}

export interface CreateOrderOptions {
  status?: OrderStatus;
  amountPaid?: number;
  createdByAdmin?: boolean;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
    @Inject(ORDER_IMAGE_STORE) private readonly images: OrderImageStore,
    @Inject(ORDER_NOTIFIER) private readonly notifier: OrderNotifier,
    private readonly cartParser: CartParser,
    private readonly assignSlot: AssignSlotUseCase,
  ) {}

  async execute(
    input: CreateOrderInput,
    photos: UploadedImage[],
    options: CreateOrderOptions = {},
  ): Promise<Order> {
    const status = options.status ?? ORDER_STATUS.PENDING;
    const cart = await this.cartParser.parse(input.cartItemsJson);
    const slotId = await this.assignSlot.execute(input.deliveryDate);

    let order = await this.repo.create(
      {
        customerInstagram: input.customerInstagram,
        deliveryDate: toDeliveryTimestamp(input.deliveryDate),
        availabilitySlotId: slotId,
        description: input.description,
        deliveryMethod: input.deliveryMethod,
        amountPaid: resolvePaidAmount(
          status,
          options.amountPaid ?? 0,
          cart.totalAmount,
        ),
        totalAmount: cart.totalAmount,
        status,
      },
      cart.items,
    );

    if (photos.length > 0) {
      const urls = await this.images.save(order.id, photos);
      order = await this.repo.setReferencePhotos(order.id, urls);
    }

    await this.notifier.notifyNewOrder(order, options.createdByAdmin ?? false);
    return order;
  }
}
