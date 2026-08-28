import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShopClock } from "./shop-clock";

describe("ShopClock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the local day for the configured timezone", () => {
    // 23:00 UTC — a different calendar day east and west of UTC.
    vi.setSystemTime(new Date("2026-08-27T23:00:00Z"));
    expect(new ShopClock("UTC").today()).toBe("2026-08-27");
    expect(new ShopClock("Asia/Tokyo").today()).toBe("2026-08-28"); // UTC+9
  });
});
