import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE } from "./media.constants";
import { type UploadedImage, validateImage } from "./uploaded-image";

const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
]);

function pngUpload(overrides: Partial<UploadedImage> = {}): UploadedImage {
  return {
    originalName: "photo.png",
    mimeType: "image/png",
    buffer: PNG_HEADER,
    ...overrides,
  };
}

describe("validateImage", () => {
  it("accepts a valid image whose magic bytes match its claimed type", () => {
    expect(validateImage(pngUpload())).toBe(true);
  });

  it("rejects an upload without a filename", () => {
    expect(validateImage(pngUpload({ originalName: "" }))).toBe(false);
  });

  it("rejects a disallowed mime type", () => {
    expect(validateImage(pngUpload({ mimeType: "image/svg+xml" }))).toBe(false);
  });

  it("rejects when the claimed type does not match the magic bytes", () => {
    expect(validateImage(pngUpload({ mimeType: "image/jpeg" }))).toBe(false);
  });

  it("rejects a file over the size cap", () => {
    const buffer = Buffer.alloc(MAX_FILE_SIZE + 1);
    PNG_HEADER.copy(buffer);
    expect(validateImage(pngUpload({ buffer }))).toBe(false);
  });
});
