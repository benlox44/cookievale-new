import { describe, expect, it } from "vitest";

import { safeCompare } from "./safe-compare";

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("abc", "abc")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(safeCompare("abc", "abd")).toBe(false);
  });

  it("returns false for different lengths without throwing", () => {
    expect(safeCompare("abc", "abcdef")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(safeCompare("", "")).toBe(true);
  });

  it("returns false for equal character counts but different byte lengths", () => {
    expect(safeCompare("abcdéf", "abcdef")).toBe(false);
  });

  it("returns true for identical multibyte strings", () => {
    expect(safeCompare("aé", "aé")).toBe(true);
  });
});
