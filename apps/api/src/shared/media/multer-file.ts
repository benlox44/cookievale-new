import { type UploadedImage } from "./uploaded-image";

/**
 * The multer fields we use, declared locally because `@types/multer`
 * (`Express.Multer.File`) is not installed.
 */
export interface MulterFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export function toUploadedImage(file: MulterFile): UploadedImage {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    buffer: file.buffer,
  };
}
