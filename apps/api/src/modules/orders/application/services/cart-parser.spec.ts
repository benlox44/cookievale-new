import { describe, expect, it, vi } from "vitest";

import { GetProductUseCase } from "../../../products/application/use-cases/get-product.use-case";
import { ProductNotFoundException } from "../../../products/domain/exceptions/product-not-found.exception";
import { CartException } from "../../domain/exceptions/cart.exception";
import { CartParser } from "./cart-parser";

const product = (price: number, name: string, isActive = true) => ({
  id: 1,
  name,
  description: null,
  price,
  imageUrls: [],
  isActive,
  displayOrder: 0,
});

function parser(execute: ReturnType<typeof vi.fn>): CartParser {
  return new CartParser({ execute } as unknown as GetProductUseCase);
}

describe("CartParser", () => {
  it("resolves live price/name for active products and totals", async () => {
    const cart = await parser(
      vi.fn().mockResolvedValue(product(500, "Torta")),
    ).parse(JSON.stringify([{ productId: 1, quantity: 2 }]));
    expect(cart.items).toEqual([
      { productId: 1, quantity: 2, unitPrice: 500, productName: "Torta" },
    ]);
    expect(cart.totalAmount).toBe(1000);
  });

  it("uses the stored snapshot and skips the product lookup", async () => {
    const execute = vi.fn();
    const stored = new Map([[1, { unitPrice: 300, productName: "Old name" }]]);
    const cart = await parser(execute).parse(
      JSON.stringify([{ productId: 1, quantity: 2 }]),
      stored,
    );
    expect(cart.items[0]).toEqual({
      productId: 1,
      quantity: 2,
      unitPrice: 300,
      productName: "Old name",
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects an inactive product", async () => {
    await expect(
      parser(vi.fn().mockResolvedValue(product(500, "X", false))).parse(
        JSON.stringify([{ productId: 1, quantity: 1 }]),
      ),
    ).rejects.toThrow(CartException);
  });

  it("rejects a missing product", async () => {
    await expect(
      parser(vi.fn().mockRejectedValue(new ProductNotFoundException())).parse(
        JSON.stringify([{ productId: 1, quantity: 1 }]),
      ),
    ).rejects.toThrow(CartException);
  });
});
