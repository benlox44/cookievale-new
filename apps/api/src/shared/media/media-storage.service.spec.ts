import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MediaStorageService } from "./media-storage.service";
import { type UploadedImage } from "./uploaded-image";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
]);

function png(name = "photo.png"): UploadedImage {
  return { originalName: name, mimeType: "image/png", buffer: PNG };
}

describe("MediaStorageService", () => {
  let root: string;
  let service: MediaStorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "cv-media-"));
    service = new MediaStorageService({ mediaRoot: root });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("saves valid uploads under a random name and returns their URLs", async () => {
    const urls = await service.saveUploads(
      [png()],
      "orders/1",
      "/media/orders/1",
    );

    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/^\/media\/orders\/1\/[0-9a-f]{32}\.png$/);
    const files = await readdir(join(root, "orders/1"));
    expect(files).toHaveLength(1);
  });

  it("skips invalid uploads instead of writing them", async () => {
    const bad: UploadedImage = {
      originalName: "fake.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    };
    const urls = await service.saveUploads(
      [png(), bad],
      "orders/2",
      "/media/orders/2",
    );

    expect(urls).toHaveLength(1);
    expect(await readdir(join(root, "orders/2"))).toHaveLength(1);
  });

  it("deletes only the named files within a directory", async () => {
    const dir = join(root, "orders/3");
    await service.saveUploads([png()], "orders/3", "/media/orders/3");
    const kept = (await readdir(dir))[0];
    await writeFile(join(dir, "victim.png"), PNG);

    await service.deleteMediaFiles("orders/3", ["/media/orders/3/victim.png"]);

    expect(await readdir(dir)).toEqual([kept]);
  });

  it("does not throw when deleting a missing file", async () => {
    await expect(
      service.deleteMediaFiles("orders/4", ["/media/orders/4/nope.png"]),
    ).resolves.toBeUndefined();
  });

  it("removes an entire directory", async () => {
    await service.saveUploads([png()], "orders/5", "/media/orders/5");
    await service.deleteDirectory("orders/5");
    await expect(readdir(join(root, "orders/5"))).rejects.toThrow();
  });

  describe("updatePhotoSet", () => {
    it("keeps referenced photos, saves new ones and reports removals", async () => {
      const existing = await service.saveUploads(
        [png("a.png"), png("b.png")],
        "orders/6",
        "/media/orders/6",
      );

      const result = await service.updatePhotoSet({
        currentUrls: existing,
        existingUrls: [existing[0]],
        imageOrder: JSON.stringify(["new:0", existing[0]]),
        photos: [png("c.png")],
        maxImages: 8,
        relativeDir: "orders/6",
        urlPrefix: "/media/orders/6",
      });

      expect(result.finalUrls).toHaveLength(2);
      expect(result.finalUrls[1]).toBe(existing[0]);
      expect(result.removedUrls).toEqual([existing[1]]);
    });

    it("does not exceed maxImages when photos are already at the cap", async () => {
      const existing = await service.saveUploads(
        [png("a.png")],
        "orders/7",
        "/media/orders/7",
      );

      const result = await service.updatePhotoSet({
        currentUrls: existing,
        existingUrls: existing,
        imageOrder: "[]",
        photos: [png("b.png")],
        maxImages: 1,
        relativeDir: "orders/7",
        urlPrefix: "/media/orders/7",
      });

      expect(result.finalUrls).toEqual(existing);
      expect(result.removedUrls).toEqual([]);
      expect(await readdir(join(root, "orders/7"))).toHaveLength(1);
    });
  });
});
