import { type UploadedImage } from "../../../../shared/media/uploaded-image";

export const PRODUCT_IMAGE_STORE = Symbol("PRODUCT_IMAGE_STORE");

export interface ReconcileResult {
  finalUrls: string[];
  /** URLs no longer kept; delete their files after the row is persisted. */
  removedUrls: string[];
}

/** Product image storage, keyed by product id (hides the media path layout). */
export interface ProductImageStore {
  save(productId: number, photos: UploadedImage[]): Promise<string[]>;
  reconcile(
    productId: number,
    currentUrls: string[],
    existingUrls: string[],
    imageOrder: string,
    photos: UploadedImage[],
  ): Promise<ReconcileResult>;
  deleteFiles(productId: number, urls: string[]): Promise<void>;
  deleteAll(productId: number): Promise<void>;
}
