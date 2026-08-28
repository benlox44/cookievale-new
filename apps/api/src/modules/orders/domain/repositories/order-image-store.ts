import { type UploadedImage } from "../../../../shared/media/uploaded-image";

export const ORDER_IMAGE_STORE = Symbol("ORDER_IMAGE_STORE");

export interface ReconcileResult {
  finalUrls: string[];
  /** URLs no longer kept; delete their files after the row is persisted. */
  removedUrls: string[];
}

/** Order reference-photo storage, keyed by order id (hides the media layout). */
export interface OrderImageStore {
  save(orderId: number, photos: UploadedImage[]): Promise<string[]>;
  reconcile(
    orderId: number,
    currentUrls: string[],
    existingUrls: string[],
    imageOrder: string,
    photos: UploadedImage[],
  ): Promise<ReconcileResult>;
  deleteFiles(orderId: number, urls: string[]): Promise<void>;
  deleteAll(orderId: number): Promise<void>;
}
