import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { Inject, Injectable, Logger } from "@nestjs/common";

import { buildImageOrder } from "./image-order";
import { detectImageType, safeExtension } from "./image-type";
import { MEDIA_CONFIG, type MediaConfig } from "./media-config";
import { type UploadedImage, validateImage } from "./uploaded-image";

export interface UpdatePhotoSetParams {
  currentUrls: string[];
  existingUrls: string[];
  /** JSON: existing URLs plus `new:<index>` placeholders for new uploads. */
  imageOrder: string;
  photos: UploadedImage[];
  maxImages: number;
  relativeDir: string;
  urlPrefix: string;
}

export interface UpdatePhotoSetResult {
  finalUrls: string[];
  removedUrls: string[];
}

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);

  constructor(@Inject(MEDIA_CONFIG) private readonly config: MediaConfig) {}

  /** Random filenames avoid collisions and hide client-supplied names. */
  async saveUploads(
    files: UploadedImage[],
    relativeDir: string,
    urlPrefix: string,
  ): Promise<string[]> {
    const targetDir = join(this.config.mediaRoot, relativeDir);
    await mkdir(targetDir, { recursive: true });

    const savedUrls: string[] = [];
    for (const file of files) {
      if (!validateImage(file)) {
        this.logger.warn(`Rejected invalid upload: ${file.originalName}`);
        continue;
      }

      const detected = detectImageType(file.buffer.subarray(0, 12));
      const filename = `${randomBytes(16).toString("hex")}.${safeExtension(
        detected,
        file.originalName,
      )}`;
      await writeFile(join(targetDir, filename), file.buffer);
      savedUrls.push(`${urlPrefix}/${filename}`);
    }

    return savedUrls;
  }

  /**
   * Shared by orders and products; returns the removed URLs so the caller can
   * delete their files once the new set is persisted.
   */
  async updatePhotoSet(
    params: UpdatePhotoSetParams,
  ): Promise<UpdatePhotoSetResult> {
    const currentSet = new Set(params.currentUrls);
    const kept = params.existingUrls.filter((url) => currentSet.has(url));

    let newUrls: string[] = [];
    const validPhotos = params.photos.filter((photo) => photo.originalName);
    const remaining = params.maxImages - kept.length;
    if (validPhotos.length > 0 && remaining > 0) {
      newUrls = await this.saveUploads(
        validPhotos.slice(0, remaining),
        params.relativeDir,
        params.urlPrefix,
      );
    }

    let finalUrls = buildImageOrder(
      params.imageOrder,
      params.currentUrls,
      newUrls,
    );
    if (finalUrls.length === 0) {
      /** Empty/malformed ordering: keep existing photos, then the new ones. */
      finalUrls = [...kept, ...newUrls];
    }
    finalUrls = finalUrls.slice(0, params.maxImages);

    const finalSet = new Set(finalUrls);
    const removedUrls = params.currentUrls.filter((url) => !finalSet.has(url));
    return { finalUrls, removedUrls };
  }

  async deleteMediaFiles(relativeDir: string, urls: string[]): Promise<void> {
    const dir = join(this.config.mediaRoot, relativeDir);
    for (const url of urls) {
      const filename = basename(url);
      if (!filename) {
        continue;
      }
      await rm(join(dir, filename), { force: true });
    }
  }

  async deleteDirectory(relativeDir: string): Promise<void> {
    await rm(join(this.config.mediaRoot, relativeDir), {
      recursive: true,
      force: true,
    });
  }
}
