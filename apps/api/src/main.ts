import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { loadConfig } from "./shared/config/env";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app, config);

  if (config.nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("CookieVale API")
      .setDescription("CookieVale bakery order management system")
      .setVersion("1.0")
      .build();
    SwaggerModule.setup(
      "docs",
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  app.enableShutdownHooks();
  await app.listen(config.port, "0.0.0.0");
}

void bootstrap();
