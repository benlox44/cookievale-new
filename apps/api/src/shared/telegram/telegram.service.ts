import { Inject, Injectable, Logger } from "@nestjs/common";

import {
  TELEGRAM_CONFIG,
  type TelegramConfig,
  type TelegramNotifier,
} from "./telegram-notifier";

const TELEGRAM_API_BASE = "https://api.telegram.org";
/** A slow Telegram API must not stall the request that triggered the notice. */
const REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class HttpTelegramNotifier implements TelegramNotifier {
  private readonly logger = new Logger(HttpTelegramNotifier.name);

  constructor(
    @Inject(TELEGRAM_CONFIG) private readonly config: TelegramConfig,
  ) {}

  async sendMessage(text: string): Promise<void> {
    const url = `${TELEGRAM_API_BASE}/bot${this.config.botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: "HTML",
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to send Telegram notification: HTTP ${String(response.status)}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram notification: ${String(error)}`,
      );
    }
  }
}
