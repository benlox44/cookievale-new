import { Inject, Injectable } from "@nestjs/common";

import { RemoveSlotUseCase } from "../../../scheduling/application/use-cases/remove-slot.use-case";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import {
  ORDER_IMAGE_STORE,
  type OrderImageStore,
} from "../../domain/repositories/order-image-store";
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from "../../domain/repositories/order-repository";

@Injectable()
export class DeleteOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
    @Inject(ORDER_IMAGE_STORE) private readonly images: OrderImageStore,
    private readonly removeSlot: RemoveSlotUseCase,
  ) {}

  async execute(id: number): Promise<void> {
    const order = await this.repo.getById(id);
    if (order === null) {
      throw new OrderNotFoundException();
    }
    await this.repo.delete(id);
    await this.images.deleteAll(id);
    if (order.availabilitySlotId !== null) {
      await this.removeSlot.execute(order.availabilitySlotId);
    }
  }
}
