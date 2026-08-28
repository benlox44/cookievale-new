import {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from "@cookievale/shared";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min } from "class-validator";

import { CreateOrderDto } from "./create-order.dto";

export class AdminCreateOrderDto extends CreateOrderDto {
  @IsOptional()
  @IsIn(ORDER_STATUS_VALUES)
  status: OrderStatus = ORDER_STATUS.PENDING;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountPaid = 0;
}
