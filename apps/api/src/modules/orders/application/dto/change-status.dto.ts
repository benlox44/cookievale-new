import { ORDER_STATUS_VALUES, type OrderStatus } from "@cookievale/shared";
import { IsIn } from "class-validator";

export class ChangeStatusDto {
  @IsIn(ORDER_STATUS_VALUES)
  status!: OrderStatus;
}
