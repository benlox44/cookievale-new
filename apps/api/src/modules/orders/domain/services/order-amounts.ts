import { ORDER_STATUS, type OrderStatus } from "@cookievale/shared";

/** Paid/delivered orders are fully paid; otherwise clamp the request to [0, total]. */
export function resolvePaidAmount(
  status: OrderStatus,
  requested: number,
  total: number,
): number {
  if (status === ORDER_STATUS.PAID || status === ORDER_STATUS.DELIVERED) {
    return total;
  }
  return Math.max(0, Math.min(requested, total));
}

/** A `YYYY-MM-DD` delivery date stored as local midnight in the naive column. */
export function toDeliveryTimestamp(date: string): Date {
  return new Date(`${date}T00:00:00`);
}
