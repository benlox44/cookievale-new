export const TELEGRAM_NOTIFIER = Symbol("TELEGRAM_NOTIFIER");

/** A notification outage should not break the business flow. */
export interface TelegramNotifier {
  sendMessage(text: string): Promise<void>;
}

export const TELEGRAM_CONFIG = Symbol("TELEGRAM_CONFIG");

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}
