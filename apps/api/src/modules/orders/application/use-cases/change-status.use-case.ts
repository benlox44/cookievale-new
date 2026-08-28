import { type OrderStatus } from "@cookievale/shared";
import { Inject, Injectable } from "@nestjs/common";

import { type Order } from "../../domain/entities/order";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/repositories/order-repository";
import { resolvePaidAmount } from "../../domain/services/order-amounts";

@Injectable()
export class ChangeStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
  ) {}

  async execute(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.repo.getById(id);
    if (order === null) {
      throw new OrderNotFoundException();
    }
    return this.repo.update(id, {
      deliveryDate: order.deliveryDate,
      availabilitySlotId: order.availabilitySlotId,
      description: order.description,
      deliveryMethod: order.deliveryMethod,
      amountPaid: resolvePaidAmount(
        status,
        order.amountPaid,
        order.totalAmount,
      ),
      totalAmount: order.totalAmount,
      status,
      referencePhotos: order.referencePhotos,
    });
  }
}
