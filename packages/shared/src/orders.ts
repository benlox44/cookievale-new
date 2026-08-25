export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PAID: "paid",
  DELIVERED: "delivered",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_VALUES: readonly OrderStatus[] =
  Object.values(ORDER_STATUS);

export const DELIVERY_METHOD = {
  PICKUP: "pickup",
  DELIVERY: "delivery",
} as const;

export type DeliveryMethod =
  (typeof DELIVERY_METHOD)[keyof typeof DELIVERY_METHOD];

export const DELIVERY_METHOD_VALUES: readonly DeliveryMethod[] =
  Object.values(DELIVERY_METHOD);
