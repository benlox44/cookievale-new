import {
  DELIVERY_METHOD_VALUES,
  type DeliveryMethod,
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from "@cookievale/shared";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

function parseStringArray(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export class UpdateOrderDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "deliveryDate must be YYYY-MM-DD",
  })
  deliveryDate!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsIn(DELIVERY_METHOD_VALUES)
  deliveryMethod!: DeliveryMethod;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountPaid!: number;

  @IsIn(ORDER_STATUS_VALUES)
  status!: OrderStatus;

  /** When present, replace the whole line-item set. */
  @IsOptional()
  @IsString()
  cartItemsJson?: string;

  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  existingPhotos: string[] = [];

  @IsString()
  imageOrder = "[]";
}
