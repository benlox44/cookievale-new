import { Injectable } from "@nestjs/common";

import { GetProductUseCase } from "../../../products/application/use-cases/get-product.use-case";
import { ProductNotFoundException } from "../../../products/domain/exceptions/product-not-found.exception";
import { CartException } from "../../domain/exceptions/cart.exception";
import { type OrderItemInput } from "../../domain/repositories/order-repository";
import { mergeCartLines } from "../../domain/services/cart-lines";

export interface StoredLine {
  unitPrice: number;
  productName: string;
}

export interface ParsedCart {
  items: OrderItemInput[];
  totalAmount: number;
}

@Injectable()
export class CartParser {
  constructor(private readonly getProduct: GetProductUseCase) {}

  /**
   * Resolve each cart line's price/name server-side: the snapshot from `stored`
   * (edit path — a since-deactivated product stays orderable), otherwise the
   * live product, which must exist and be active.
   */
  async parse(
    cartJson: string,
    stored?: Map<number, StoredLine>,
  ): Promise<ParsedCart> {
    const items: OrderItemInput[] = [];
    for (const line of mergeCartLines(cartJson)) {
      const snapshot = stored?.get(line.productId);
      if (snapshot !== undefined) {
        items.push({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: snapshot.unitPrice,
          productName: snapshot.productName,
        });
        continue;
      }
      const product = await this.resolveActive(line.productId);
      items.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: product.price,
        productName: product.name,
      });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    return { items, totalAmount };
  }

  private async resolveActive(productId: number) {
    let product;
    try {
      product = await this.getProduct.execute(productId);
    } catch (error) {
      if (error instanceof ProductNotFoundException) {
        throw new CartException("A selected product is no longer available");
      }
      throw error;
    }
    if (!product.isActive) {
      throw new CartException("A selected product is no longer available");
    }
    return product;
  }
}
