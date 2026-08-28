import { type Product } from "../entities/product";

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");

/** Editable product fields (id, images and display order are handled apart). */
export interface ProductInput {
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
}

export interface ProductRepository {
  /** All products, admin order: `display_order ASC, id DESC`. */
  listAll(): Promise<Product[]>;
  /** Active products only, same order (the public menu). */
  listActive(): Promise<Product[]>;
  getById(id: number): Promise<Product | null>;
  create(data: ProductInput): Promise<Product>;
  setImages(id: number, imageUrls: string[]): Promise<Product>;
  update(id: number, data: ProductInput, imageUrls: string[]): Promise<Product>;
  /** Assign `display_order = position` across the given ordered ids. */
  reorder(orderedIds: number[]): Promise<void>;
  /** True when any order line still references the product (delete guard). */
  isReferencedByOrder(id: number): Promise<boolean>;
  delete(id: number): Promise<void>;
}
