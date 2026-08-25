import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { DrizzleModule } from "./shared/drizzle/drizzle.module";

@Module({
  imports: [DrizzleModule],
  controllers: [AppController],
})
export class AppModule {}
