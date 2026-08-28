import { Transform } from "class-transformer";
import { IsArray, IsString } from "class-validator";

import { CreateProductDto } from "./create-product.dto";

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

export class UpdateProductDto extends CreateProductDto {
  // JSON array of the existing image URLs the form still keeps.
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  existingImages: string[] = [];

  // JSON drag-and-drop order (existing URLs + `new:<index>` tokens); parsed downstream.
  @IsString()
  imageOrder = "[]";
}
