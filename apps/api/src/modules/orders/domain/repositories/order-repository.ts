import { type DeliveryMethod, type OrderStatus } from "@cookievale/shared";

import { type Order } from "../entities/order";

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");

export interface OrderItemInput {
  productId: number | null;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export interface CreateOrderData {
  customerInstagram: string;
  deliveryDate: Date;
  availabilitySlotId: number | null;
  description: string;
  deliveryMethod: DeliveryMethod;
  amountPaid: number;
  totalAmount: number;
  status: OrderStatus;
}

export interface UpdateOrderData {
  deliveryDate: Date;
  availabilitySlotId: number | null;
  description: string;
  deliveryMethod: DeliveryMethod;
  amountPaid: number;
  totalAmount: number;
  status: OrderStatus;
  referencePhotos: string[];
}

export interface ListOrdersParams {
  includeDelivered: boolean;
  limit: number;
  offset: number;
  sortBy: "id" | "date";
  sortDir: "asc" | "desc";
}

export interface OrderRepository {
  /** Inserts the order + items in one transaction; the slot unique index guards the race. */
  create(data: CreateOrderData, items: OrderItemInput[]): Promise<Order>;
  setReferencePhotos(id: number, urls: string[]): Promise<Order>;
  getById(id: number): Promise<Order | null>;
  list(params: ListOrdersParams): Promise<Order[]>;
  count(includeDelivered: boolean): Promise<number>;
  /** Updates the mutable fields; replaces items when `items` is given. */
  update(
    id: number,
    data: UpdateOrderData,
    items?: OrderItemInput[],
  ): Promise<Order>;
  delete(id: number): Promise<void>;
}
