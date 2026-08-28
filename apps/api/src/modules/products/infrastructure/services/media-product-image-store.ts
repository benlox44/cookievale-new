import { Injectable } from "@nestjs/common";

import { MAX_PRODUCT_IMAGES } from "../../../../shared/media/media.constants";
import { MediaStorageService } from "../../../../shared/media/media-storage.service";
import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import {
  type ProductImageStore,
  type ReconcileResult,
} from "../../domain/repositories/product-image-store";

@Injectable()
export class MediaProductImageStore implements ProductImageStore {
  constructor(private readonly media: MediaStorageService) {}

  private dir(productId: number): string {
    return `products/${String(productId)}`;
  }

  private prefix(productId: number): string {
    return `/media/products/${String(productId)}`;
  }

  save(productId: number, photos: UploadedImage[]): Promise<string[]> {
    return this.media.saveUploads(
      photos,
      this.dir(productId),
      this.prefix(productId),
    );
  }

  reconcile(
    productId: number,
    currentUrls: string[],
    existingUrls: string[],
    imageOrder: string,
    photos: UploadedImage[],
  ): Promise<ReconcileResult> {
    return this.media.updatePhotoSet({
      currentUrls,
      existingUrls,
      imageOrder,
      photos,
      maxImages: MAX_PRODUCT_IMAGES,
      relativeDir: this.dir(productId),
      urlPrefix: this.prefix(productId),
    });
  }

  deleteFiles(productId: number, urls: string[]): Promise<void> {
    return this.media.deleteMediaFiles(this.dir(productId), urls);
  }

  deleteAll(productId: number): Promise<void> {
    return this.media.deleteDirectory(this.dir(productId));
  }
}
