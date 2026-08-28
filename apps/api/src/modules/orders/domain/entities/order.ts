import { type DeliveryMethod, type OrderStatus } from "@cookievale/shared";

import { type OrderItem } from "./order-item";

export interface Order {
  id: number;
  customerInstagram: string;
  deliveryDate: Date;
  availabilitySlotId: number | null;
  description: string;
  deliveryMethod: DeliveryMethod;
  amountPaid: number;
  totalAmount: number;
  referencePhotos: string[];
  status: OrderStatus;
  items: OrderItem[];
}
