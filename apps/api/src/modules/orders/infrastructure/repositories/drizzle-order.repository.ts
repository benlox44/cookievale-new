import { ORDER_STATUS } from "@cookievale/shared";
import { Injectable } from "@nestjs/common";
import { asc, count, desc, eq, inArray, ne } from "drizzle-orm";

import { DrizzleService } from "../../../../shared/drizzle/drizzle.service";
import { orderItems, orders } from "../../../../shared/drizzle/schema";
import { type Order } from "../../domain/entities/order";
import { type OrderItem } from "../../domain/entities/order-item";
import { OrderSlotUnavailableException } from "../../domain/exceptions/order-slot-unavailable.exception";
import {
  type CreateOrderData,
  type ListOrdersParams,
  type OrderItemInput,
  type OrderRepository,
  type UpdateOrderData,
} from "../../domain/repositories/order-repository";

/** Drizzle wraps the driver error, so the postgres "23505" code sits on `.cause`. */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (typeof current === "object" && current !== null) {
    if ((current as { code?: unknown }).code === "23505") {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

type OrderRow = Omit<Order, "items">;
type Tx = Parameters<Parameters<DrizzleService["db"]["transaction"]>[0]>[0];

@Injectable()
export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db(): DrizzleService["db"] {
    return this.drizzle.db;
  }

  private readonly orderColumns = {
    id: orders.id,
    customerInstagram: orders.customerInstagram,
    deliveryDate: orders.deliveryDate,
    availabilitySlotId: orders.availabilitySlotId,
    description: orders.description,
    deliveryMethod: orders.deliveryMethod,
    amountPaid: orders.amountPaid,
    totalAmount: orders.totalAmount,
    referencePhotos: orders.referencePhotos,
    status: orders.status,
  };

  private readonly itemColumns = {
    productId: orderItems.productId,
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    productName: orderItems.productName,
  };

  private itemRows(id: number, items: OrderItemInput[]) {
    return items.map((item) => ({ orderId: id, ...item }));
  }

  private async withItems(rows: OrderRow[]): Promise<Order[]> {
    if (rows.length === 0) {
      return [];
    }
    const found = await this.db
      .select({ orderId: orderItems.orderId, ...this.itemColumns })
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          rows.map((row) => row.id),
        ),
      );
    const byOrder = new Map<number, OrderItem[]>();
    for (const { orderId, ...item } of found) {
      const list = byOrder.get(orderId) ?? [];
      list.push(item);
      byOrder.set(orderId, list);
    }
    return rows.map((row) => ({ ...row, items: byOrder.get(row.id) ?? [] }));
  }

  async create(data: CreateOrderData, items: OrderItemInput[]): Promise<Order> {
    try {
      return await this.db.transaction(async (tx: Tx) => {
        const [order] = await tx
          .insert(orders)
          .values(data)
          .returning(this.orderColumns);
        if (items.length > 0) {
          await tx.insert(orderItems).values(this.itemRows(order.id, items));
        }
        return { ...order, items };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new OrderSlotUnavailableException();
      }
      throw error;
    }
  }

  async setReferencePhotos(id: number, urls: string[]): Promise<Order> {
    const [order] = await this.db
      .update(orders)
      .set({ referencePhotos: urls })
      .where(eq(orders.id, id))
      .returning(this.orderColumns);
    const [full] = await this.withItems([order]);
    return full;
  }

  async getById(id: number): Promise<Order | null> {
    const rows = await this.db
      .select(this.orderColumns)
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    if (rows.length === 0) {
      return null;
    }
    const [order] = await this.withItems(rows);
    return order;
  }

  async list(params: ListOrdersParams): Promise<Order[]> {
    const column = params.sortBy === "id" ? orders.id : orders.deliveryDate;
    const direction = params.sortDir === "asc" ? asc(column) : desc(column);
    const rows = await this.db
      .select(this.orderColumns)
      .from(orders)
      .where(
        params.includeDelivered
          ? undefined
          : ne(orders.status, ORDER_STATUS.DELIVERED),
      )
      .orderBy(direction)
      .limit(params.limit)
      .offset(params.offset);
    return this.withItems(rows);
  }

  async count(includeDelivered: boolean): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(orders)
      .where(
        includeDelivered
          ? undefined
          : ne(orders.status, ORDER_STATUS.DELIVERED),
      );
    return row.total;
  }

  async update(
    id: number,
    data: UpdateOrderData,
    items?: OrderItemInput[],
  ): Promise<Order> {
    try {
      return await this.db.transaction(async (tx: Tx) => {
        const [order] = await tx
          .update(orders)
          .set(data)
          .where(eq(orders.id, id))
          .returning(this.orderColumns);

        let finalItems: OrderItem[];
        if (items === undefined) {
          finalItems = await tx
            .select(this.itemColumns)
            .from(orderItems)
            .where(eq(orderItems.orderId, id));
        } else {
          await tx.delete(orderItems).where(eq(orderItems.orderId, id));
          if (items.length > 0) {
            await tx.insert(orderItems).values(this.itemRows(id, items));
          }
          finalItems = items;
        }
        return { ...order, items: finalItems };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new OrderSlotUnavailableException();
      }
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(orders).where(eq(orders.id, id));
  }
}
