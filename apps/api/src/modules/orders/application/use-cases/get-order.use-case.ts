import { Inject, Injectable } from "@nestjs/common";

import { type Order } from "../../domain/entities/order";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/repositories/order-repository";

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
  ) {}

  async execute(id: number): Promise<Order> {
    const order = await this.repo.getById(id);
    if (order === null) {
      throw new OrderNotFoundException();
    }
    return order;
  }
}
