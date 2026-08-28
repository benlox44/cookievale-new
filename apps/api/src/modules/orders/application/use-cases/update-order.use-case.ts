import { type DeliveryMethod, type OrderStatus } from "@cookievale/shared";
import { Inject, Injectable } from "@nestjs/common";

import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import { AssignSlotUseCase } from "../../../scheduling/application/use-cases/assign-slot.use-case";
import { SlotUnavailableException } from "../../../scheduling/domain/exceptions/slot-unavailable.exception";
import { CLOCK, type Clock } from "../../../scheduling/domain/services/clock";
import { type Order } from "../../domain/entities/order";
import { OrderNotFoundException } from "../../domain/exceptions/order-not-found.exception";
import {
  ORDER_IMAGE_STORE,
  type OrderImageStore,
} from "../../domain/repositories/order-image-store";
import {
  ORDER_REPOSITORY,
  type OrderItemInput,
  type OrderRepository,
} from "../../domain/repositories/order-repository";
import {
  resolvePaidAmount,
  toDeliveryTimestamp,
} from "../../domain/services/order-amounts";
import { CartParser, type StoredLine } from "../services/cart-parser";

export interface UpdateOrderInput {
  deliveryDate: string;
  description: string;
  deliveryMethod: DeliveryMethod;
  amountPaid: number;
  status: OrderStatus;
  /** When present, replace the whole line-item set. */
  cartItemsJson?: string;
}

export interface UpdateOrderImages {
  existingPhotos: string[];
  imageOrder: string;
  photos: UploadedImage[];
}

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly repo: OrderRepository,
    @Inject(ORDER_IMAGE_STORE) private readonly images: OrderImageStore,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly cartParser: CartParser,
    private readonly assignSlot: AssignSlotUseCase,
  ) {}

  async execute(
    id: number,
    input: UpdateOrderInput,
    images: UpdateOrderImages,
  ): Promise<Order> {
    const order = await this.repo.getById(id);
    if (order === null) {
      throw new OrderNotFoundException();
    }

    const slotId = await this.rematchSlot(input.deliveryDate, order);

    let items: OrderItemInput[] | undefined;
    let total = order.totalAmount;
    if (input.cartItemsJson !== undefined) {
      const cart = await this.cartParser.parse(
        input.cartItemsJson,
        this.storedPrices(order),
      );
      items = cart.items;
      total = cart.totalAmount;
    }

    const { finalUrls, removedUrls } = await this.images.reconcile(
      id,
      order.referencePhotos,
      images.existingPhotos,
      images.imageOrder,
      images.photos,
    );

    const updated = await this.repo.update(
      id,
      {
        deliveryDate: toDeliveryTimestamp(input.deliveryDate),
        availabilitySlotId: slotId,
        description: input.description,
        deliveryMethod: input.deliveryMethod,
        amountPaid: resolvePaidAmount(input.status, input.amountPaid, total),
        totalAmount: total,
        status: input.status,
        referencePhotos: finalUrls,
      },
      items,
    );

    if (removedUrls.length > 0) {
      await this.images.deleteFiles(id, removedUrls);
    }
    return updated;
  }

  /** Keep the order's own slot if still on the date; past dates carry no slot. */
  private async rematchSlot(
    date: string,
    order: Order,
  ): Promise<number | null> {
    try {
      return await this.assignSlot.execute(date, order.availabilitySlotId);
    } catch (error) {
      if (
        error instanceof SlotUnavailableException &&
        date < this.clock.today()
      ) {
        return null;
      }
      throw error;
    }
  }

  private storedPrices(order: Order): Map<number, StoredLine> {
    const stored = new Map<number, StoredLine>();
    for (const item of order.items) {
      if (item.productId !== null) {
        stored.set(item.productId, {
          unitPrice: item.unitPrice,
          productName: item.productName,
        });
      }
    }
    return stored;
  }
}
