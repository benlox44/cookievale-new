export class ProductDto {
  id!: number;
  name!: string;
  description!: string | null;
  price!: number;
  imageUrls!: string[];
  isActive!: boolean;
  displayOrder!: number;
}
