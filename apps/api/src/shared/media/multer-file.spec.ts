import { describe, expect, it } from "vitest";

import { toUploadedImage } from "./multer-file";

describe("toUploadedImage", () => {
  it("maps multer field names onto the UploadedImage shape", () => {
    const buffer = Buffer.from([1, 2, 3]);
    expect(
      toUploadedImage({
        originalname: "cake.png",
        mimetype: "image/png",
        buffer,
      }),
    ).toEqual({ originalName: "cake.png", mimeType: "image/png", buffer });
  });
});
