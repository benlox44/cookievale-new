import { detectImageType, MIME_TO_EXT } from "./image-type";
import { MAX_FILE_SIZE } from "./media.constants";

/**
 * Transport-agnostic upload shape, so the media layer never depends on the web
 * framework; controllers adapt their `Express.Multer.File` into this.
 */
export interface UploadedImage {
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

const ALLOWED_MIME_TYPES = new Set<string>(Object.keys(MIME_TO_EXT));

/** Magic bytes must match the claimed MIME type, so a client can't spoof it. */
export function validateImage(file: UploadedImage): boolean {
  if (!file.originalName) {
    return false;
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    return false;
  }

  const detected = detectImageType(file.buffer.subarray(0, 12));
  if (detected === null || detected !== file.mimeType) {
    return false;
  }

  return file.buffer.length <= MAX_FILE_SIZE;
}
