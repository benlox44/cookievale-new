import { Logger } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpTelegramNotifier } from "./telegram.service";

const CONFIG = { botToken: "test-token", chatId: "42" };

function notifier(): HttpTelegramNotifier {
  return new HttpTelegramNotifier(CONFIG);
}

describe("HttpTelegramNotifier.sendMessage", () => {
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logError = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to the bot sendMessage endpoint with an HTML payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await notifier().sendMessage("<b>hi</b>");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/bottest-token/sendMessage");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({
      chat_id: "42",
      text: "<b>hi</b>",
      parse_mode: "HTML",
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it("swallows network errors (non-fatal) and logs them", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));

    await expect(notifier().sendMessage("hi")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledOnce();
  });

  it("logs a non-2xx response without throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    await expect(notifier().sendMessage("hi")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(
      "Failed to send Telegram notification: HTTP 401",
    );
  });
});
