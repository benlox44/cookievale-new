import { type DeliveryMethod, type OrderStatus } from "@cookievale/shared";
import { ApiProperty } from "@nestjs/swagger";

export class OrderItemDto {
  productId!: number | null;
  quantity!: number;
  unitPrice!: number;
  productName!: string;
}

export class OrderDto {
  id!: number;
  customerInstagram!: string;
  deliveryDate!: Date;
  availabilitySlotId!: number | null;
  description!: string;
  deliveryMethod!: DeliveryMethod;
  amountPaid!: number;
  totalAmount!: number;
  referencePhotos!: string[];
  status!: OrderStatus;

  @ApiProperty({ type: [OrderItemDto] })
  items!: OrderItemDto[];
}

export class OrderListDto {
  @ApiProperty({ type: [OrderDto] })
  orders!: OrderDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  totalPages!: number;
}
