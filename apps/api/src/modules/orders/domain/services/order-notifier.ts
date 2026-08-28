import { type Order } from "../entities/order";

export const ORDER_NOTIFIER = Symbol("ORDER_NOTIFIER");

/** Outbound "new order" notification; implementations must be non-fatal. */
export interface OrderNotifier {
  notifyNewOrder(order: Order, createdByAdmin: boolean): Promise<void>;
}
