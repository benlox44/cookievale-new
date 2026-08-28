import { Injectable } from "@nestjs/common";
import { asc, desc, eq, sql } from "drizzle-orm";

import { DrizzleService } from "../../../../shared/drizzle/drizzle.service";
import { orderItems, products } from "../../../../shared/drizzle/schema";
import { type Product } from "../../domain/entities/product";
import {
  type ProductInput,
  type ProductRepository,
} from "../../domain/repositories/product-repository";

@Injectable()
export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  private get db(): DrizzleService["db"] {
    return this.drizzle.db;
  }

  /** Projection that maps a row to the Product entity (drops timestamps). */
  private readonly columns = {
    id: products.id,
    name: products.name,
    description: products.description,
    price: products.price,
    imageUrls: products.imageUrls,
    isActive: products.isActive,
    displayOrder: products.displayOrder,
  };

  private ordered() {
    return this.db
      .select(this.columns)
      .from(products)
      .orderBy(asc(products.displayOrder), desc(products.id));
  }

  async listAll(): Promise<Product[]> {
    return this.ordered();
  }

  async listActive(): Promise<Product[]> {
    return this.ordered().where(eq(products.isActive, true));
  }

  async getById(id: number): Promise<Product | null> {
    const rows = await this.db
      .select(this.columns)
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: ProductInput): Promise<Product> {
    const [product] = await this.db
      .insert(products)
      .values(data)
      .returning(this.columns);
    return product;
  }

  async setImages(id: number, imageUrls: string[]): Promise<Product> {
    const [product] = await this.db
      .update(products)
      .set({ imageUrls })
      .where(eq(products.id, id))
      .returning(this.columns);
    return product;
  }

  async update(
    id: number,
    data: ProductInput,
    imageUrls: string[],
  ): Promise<Product> {
    const [product] = await this.db
      .update(products)
      .set({ ...data, imageUrls })
      .where(eq(products.id, id))
      .returning(this.columns);
    return product;
  }

  async reorder(orderedIds: number[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (let position = 0; position < orderedIds.length; position++) {
        await tx
          .update(products)
          .set({ displayOrder: position })
          .where(eq(products.id, orderedIds[position]));
      }
    });
  }

  async isReferencedByOrder(id: number): Promise<boolean> {
    const rows = await this.db
      .select({ one: sql`1` })
      .from(orderItems)
      .where(eq(orderItems.productId, id))
      .limit(1);
    return rows.length > 0;
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }
}
