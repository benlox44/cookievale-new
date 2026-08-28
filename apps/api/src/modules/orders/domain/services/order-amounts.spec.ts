import { ORDER_STATUS } from "@cookievale/shared";
import { describe, expect, it } from "vitest";

import { resolvePaidAmount } from "./order-amounts";

describe("resolvePaidAmount", () => {
  it("fully pays paid/delivered orders", () => {
    expect(resolvePaidAmount(ORDER_STATUS.PAID, 0, 900)).toBe(900);
    expect(resolvePaidAmount(ORDER_STATUS.DELIVERED, 100, 900)).toBe(900);
  });

  it("clamps the requested amount to [0, total] otherwise", () => {
    expect(resolvePaidAmount(ORDER_STATUS.PENDING, -5, 900)).toBe(0);
    expect(resolvePaidAmount(ORDER_STATUS.PENDING, 2000, 900)).toBe(900);
    expect(resolvePaidAmount(ORDER_STATUS.CONFIRMED, 400, 900)).toBe(400);
  });
});
