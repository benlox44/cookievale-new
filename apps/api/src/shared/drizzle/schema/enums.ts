import {
  DELIVERY_METHOD_VALUES,
  type DeliveryMethod,
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from "@cookievale/shared";
import { pgEnum } from "drizzle-orm/pg-core";

/**
 * The shared package is the single source of truth for these values, stored
 * lowercase (the legacy app used UPPERCASE names; the cutover normalizes them).
 */
export const orderStatusEnum = pgEnum("order_status", [
  ...ORDER_STATUS_VALUES,
] as [OrderStatus, ...OrderStatus[]]);

export const deliveryMethodEnum = pgEnum("delivery_method", [
  ...DELIVERY_METHOD_VALUES,
] as [DeliveryMethod, ...DeliveryMethod[]]);
