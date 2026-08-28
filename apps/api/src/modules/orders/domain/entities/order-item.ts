export interface OrderItem {
  productId: number | null;
  quantity: number;
  /** Price snapshot at order time (integer, minor units). */
  unitPrice: number;
  /** Name snapshot at order time. */
  productName: string;
}
