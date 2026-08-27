import { describe, expect, it } from "vitest";

import { detectImageType, safeExtension } from "./image-type";

function header(...bytes: number[]): Buffer {
  const buf = Buffer.alloc(12);
  Buffer.from(bytes).copy(buf);
  return buf;
}

const JPEG = header(0xff, 0xd8, 0xff, 0xe0);
const PNG = header(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const GIF = Buffer.from("GIF89a\0\0\0\0\0\0", "latin1");
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from("WEBP", "latin1"),
]);

describe("detectImageType", () => {
  it("detects jpeg / png / gif / webp by magic bytes", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(GIF)).toBe("image/gif");
    expect(detectImageType(WEBP)).toBe("image/webp");
  });

  it("returns null for a header shorter than 12 bytes", () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull();
  });

  it("returns null for unrecognized content", () => {
    expect(detectImageType(header(0x00, 0x01, 0x02, 0x03))).toBeNull();
  });

  it("rejects a RIFF container that is not WEBP", () => {
    const avi = Buffer.concat([
      Buffer.from("RIFF", "latin1"),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from("AVI ", "latin1"),
    ]);
    expect(detectImageType(avi)).toBeNull();
  });
});

describe("safeExtension", () => {
  it("uses the detected type when present", () => {
    expect(safeExtension("image/jpeg", "whatever.png")).toBe("jpg");
  });

  it("falls back to a known extension in the filename", () => {
    expect(safeExtension(null, "photo.PNG")).toBe("png");
  });

  it("ignores directory components in the filename", () => {
    expect(safeExtension(null, "../../etc/passwd")).toBe("bin");
  });

  it("returns bin when nothing matches", () => {
    expect(safeExtension(null, "file.txt")).toBe("bin");
    expect(safeExtension(null, "noext")).toBe("bin");
  });
});
