import { describe, expect, it } from "vitest";

import { CartException } from "../exceptions/cart.exception";
import { mergeCartLines } from "./cart-lines";

describe("mergeCartLines", () => {
  it("keeps positive-quantity lines", () => {
    expect(
      mergeCartLines(
        JSON.stringify([
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ]),
      ),
    ).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ]);
  });

  it("merges duplicate product ids and drops non-positive quantities", () => {
    expect(
      mergeCartLines(
        JSON.stringify([
          { productId: 1, quantity: 2 },
          { productId: 1, quantity: 3 },
          { productId: 2, quantity: 0 },
        ]),
      ),
    ).toEqual([{ productId: 1, quantity: 5 }]);
  });

  it("throws on malformed input", () => {
    expect(() => mergeCartLines("nope")).toThrow(CartException);
    expect(() => mergeCartLines(JSON.stringify({ a: 1 }))).toThrow(
      CartException,
    );
    expect(() =>
      mergeCartLines(JSON.stringify([{ productId: "x", quantity: 1 }])),
    ).toThrow(CartException);
  });

  it("throws when empty or fully filtered", () => {
    expect(() => mergeCartLines("[]")).toThrow(/empty/i);
    expect(() =>
      mergeCartLines(JSON.stringify([{ productId: 1, quantity: 0 }])),
    ).toThrow(/empty/i);
  });
});
