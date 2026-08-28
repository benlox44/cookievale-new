import { Transform, Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, Min } from "class-validator";

export class ListOrdersQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeDelivered = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsIn(["id", "date"])
  sortBy: "id" | "date" = "date";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "desc";
}
