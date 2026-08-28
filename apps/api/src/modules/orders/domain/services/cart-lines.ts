import { CartException } from "../exceptions/cart.exception";

export interface CartLine {
  productId: number;
  quantity: number;
}

/**
 * Parse the `cartItemsJson` payload into merged lines. The client sends
 * `[{ productId, quantity }]`; non-positive quantities are dropped and repeated
 * product ids are summed. Prices are never taken from here — resolved server-side.
 */
export function mergeCartLines(cartJson: string): CartLine[] {
  let raw: unknown;
  try {
    raw = JSON.parse(cartJson);
  } catch {
    throw new CartException("Invalid cart format");
  }
  if (!Array.isArray(raw)) {
    throw new CartException("Invalid cart format");
  }
  if (raw.length === 0) {
    throw new CartException("Cart cannot be empty");
  }

  const merged = new Map<number, number>();
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      throw new CartException("Invalid cart format");
    }
    const record = entry as Record<string, unknown>;
    const productId = Number(record.productId);
    const quantity = Number(record.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity)) {
      throw new CartException("Invalid cart format");
    }
    if (quantity <= 0) {
      continue;
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  const lines = [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
  if (lines.length === 0) {
    throw new CartException("Cart cannot be empty");
  }
  return lines;
}
