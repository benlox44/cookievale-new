import {
  DELIVERY_METHOD_VALUES,
  type DeliveryMethod,
} from "@cookievale/shared";
import { Transform } from "class-transformer";
import { IsIn, IsString, Length, Matches, MaxLength } from "class-validator";

export class CreateOrderDto {
  @Transform(({ value }) =>
    typeof value === "string"
      ? value.trim().replace(/^@+/, "").toLowerCase()
      : "",
  )
  @IsString()
  @Length(1, 30)
  customerInstagram!: string;

  @IsString()
  cartItemsJson!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "deliveryDate must be YYYY-MM-DD",
  })
  deliveryDate!: string;

  @IsIn(DELIVERY_METHOD_VALUES)
  deliveryMethod!: DeliveryMethod;

  @IsString()
  @MaxLength(2000)
  description!: string;
}
