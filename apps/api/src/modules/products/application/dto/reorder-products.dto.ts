import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class ReorderProductsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  orderedIds!: number[];
}
