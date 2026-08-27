import { describe, expect, it } from "vitest";

import { buildImageOrder } from "./image-order";

const A = "/media/orders/1/a.jpg";
const B = "/media/orders/1/b.jpg";
const N0 = "/media/orders/1/new0.jpg";
const N1 = "/media/orders/1/new1.jpg";

describe("buildImageOrder", () => {
  it("orders existing URLs and resolves new:<index> placeholders", () => {
    const order = JSON.stringify([B, "new:1", A, "new:0"]);
    expect(buildImageOrder(order, [A, B], [N0, N1])).toEqual([B, N1, A, N0]);
  });

  it("drops unknown current URLs and out-of-range new indices", () => {
    const order = JSON.stringify(["/media/gone.jpg", "new:9", A]);
    expect(buildImageOrder(order, [A, B], [N0])).toEqual([A, N0]);
  });

  it("appends new uploads the order forgot to reference", () => {
    const order = JSON.stringify([A]);
    expect(buildImageOrder(order, [A], [N0, N1])).toEqual([A, N0, N1]);
  });

  it("de-duplicates repeated tokens", () => {
    const order = JSON.stringify([A, A, "new:0", "new:0"]);
    expect(buildImageOrder(order, [A], [N0])).toEqual([A, N0]);
  });

  it("returns [] for malformed or non-array JSON", () => {
    expect(buildImageOrder("not json", [A], [N0])).toEqual([]);
    expect(buildImageOrder(JSON.stringify({ a: 1 }), [A], [N0])).toEqual([]);
  });
});
