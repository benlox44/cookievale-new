import { Injectable } from "@nestjs/common";

import { MAX_ORDER_PHOTOS } from "../../../../shared/media/media.constants";
import { MediaStorageService } from "../../../../shared/media/media-storage.service";
import { type UploadedImage } from "../../../../shared/media/uploaded-image";
import {
  type OrderImageStore,
  type ReconcileResult,
} from "../../domain/repositories/order-image-store";

@Injectable()
export class MediaOrderImageStore implements OrderImageStore {
  constructor(private readonly media: MediaStorageService) {}

  private dir(orderId: number): string {
    return `orders/${String(orderId)}`;
  }

  private prefix(orderId: number): string {
    return `/media/orders/${String(orderId)}`;
  }

  save(orderId: number, photos: UploadedImage[]): Promise<string[]> {
    return this.media.saveUploads(
      photos,
      this.dir(orderId),
      this.prefix(orderId),
    );
  }

  reconcile(
    orderId: number,
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
      maxImages: MAX_ORDER_PHOTOS,
      relativeDir: this.dir(orderId),
      urlPrefix: this.prefix(orderId),
    });
  }

  deleteFiles(orderId: number, urls: string[]): Promise<void> {
    return this.media.deleteMediaFiles(this.dir(orderId), urls);
  }

  deleteAll(orderId: number): Promise<void> {
    return this.media.deleteDirectory(this.dir(orderId));
  }
}
