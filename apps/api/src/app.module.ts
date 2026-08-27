import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { DrizzleModule } from "./shared/drizzle/drizzle.module";
import { DomainExceptionFilter } from "./shared/http/domain-exception.filter";
import { TelegramModule } from "./shared/telegram/telegram.module";

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "default",
          ttl: 3600_000,
          limit: 100,
        },
      ],
      errorMessage: "Rate limit exceeded",
    }),
    DrizzleModule,
    TelegramModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
