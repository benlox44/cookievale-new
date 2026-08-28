import { join } from "node:path";

import { ValidationPipe } from "@nestjs/common";
import { type NestExpressApplication } from "@nestjs/platform-express";

import { type Config } from "./shared/config/env";

/** Shared runtime wiring, applied by both the bootstrap and the integration tests. */
export function configureApp(
  app: NestExpressApplication,
  config: Config,
): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(config.containerMediaPath, { prefix: "/media" });

  // Serve the built SPA (index.html at /, plus its assets). __dirname resolves
  // to /app/apps/web/dist in dev and prod. The client-route fallback lands with
  // the real frontend; the stub has no routes to fall back for.
  app.useStaticAssets(join(__dirname, "../../web/dist"));

  if (config.trustedProxyHosts.length > 0) {
    const server = app.getHttpAdapter().getInstance() as {
      set(key: string, value: string[]): void;
    };
    server.set("trust proxy", config.trustedProxyHosts);
  }
}
