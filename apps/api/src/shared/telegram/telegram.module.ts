import { Global, Module } from "@nestjs/common";

import { loadConfig } from "../config/env";
import { HttpTelegramNotifier } from "./telegram.service";
import { TELEGRAM_CONFIG, TELEGRAM_NOTIFIER } from "./telegram-notifier";

@Global()
@Module({
  providers: [
    {
      provide: TELEGRAM_CONFIG,
      useFactory: () => {
        const config = loadConfig();
        return {
          botToken: config.telegramBotToken,
          chatId: config.telegramChatId,
        };
      },
    },
    {
      provide: TELEGRAM_NOTIFIER,
      useClass: HttpTelegramNotifier,
    },
  ],
  exports: [TELEGRAM_NOTIFIER],
})
export class TelegramModule {}
