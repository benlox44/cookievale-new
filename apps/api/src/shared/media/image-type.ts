export type ImageMime = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export const MIME_TO_EXT: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const KNOWN_EXTS = new Set<string>(Object.values(MIME_TO_EXT));

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export function detectImageType(header: Buffer): ImageMime | null {
  if (header.length < 12) {
    return null;
  }

  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }
  if (header.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return "image/png";
  }
  const gifMagic = header.subarray(0, 6).toString("latin1");
  if (gifMagic === "GIF87a" || gifMagic === "GIF89a") {
    return "image/gif";
  }
  if (
    header.subarray(0, 4).toString("latin1") === "RIFF" &&
    header.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export function safeExtension(
  detected: ImageMime | null,
  originalName: string,
): string {
  if (detected !== null) {
    return MIME_TO_EXT[detected];
  }

  const base = originalName.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot !== -1) {
    const ext = base.slice(dot + 1).toLowerCase();
    if (KNOWN_EXTS.has(ext)) {
      return ext;
    }
  }

  return "bin";
}
