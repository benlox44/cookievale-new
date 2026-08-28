import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from "class-validator";

// Multipart form fields arrive as strings, so numeric/boolean fields are coerced.
export class CreateProductDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999_999_999)
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Transform(({ value }) =>
    value === undefined ? true : value === "true" || value === true,
  )
  @IsBoolean()
  isActive = true;
}
