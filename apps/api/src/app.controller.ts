import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { sql } from "drizzle-orm";

import { loadConfig } from "./shared/config/env";
import { DrizzleService } from "./shared/drizzle/drizzle.service";

@ApiTags("health")
@Controller()
export class AppController {
  private readonly config = loadConfig();

  constructor(private readonly drizzle: DrizzleService) {}

  @SkipThrottle()
  @Get("health")
  @ApiOperation({ summary: "Liveness + database check" })
  @ApiOkResponse({
    description: "API and database are up",
    schema: {
      type: "object",
      example: { status: "ok", database: "connected" },
    },
  })
  async health(): Promise<{ status: string; database: string }> {
    try {
      await this.drizzle.db.execute(sql`select 1`);
      return { status: "ok", database: "connected" };
    } catch {
      throw new ServiceUnavailableException({
        status: "degraded",
        database: "unavailable",
      });
    }
  }

  @SkipThrottle()
  @Get("robots.txt")
  @Header("Content-Type", "text/plain")
  robots(): string {
    return `User-agent: *\nAllow: /\n\nSitemap: ${this.config.baseUrl}/sitemap.xml\n`;
  }

  @SkipThrottle()
  @Get("sitemap.xml")
  @Header("Content-Type", "application/xml")
  sitemap(): string {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: this.config.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const base = this.config.baseUrl;
    const urls =
      `<url><loc>${base}/</loc><lastmod>${today}</lastmod>` +
      `<changefreq>weekly</changefreq><priority>1.0</priority></url>` +
      `<url><loc>${base}/orders/new</loc><lastmod>${today}</lastmod>` +
      `<changefreq>monthly</changefreq><priority>0.8</priority></url>`;
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      `${urls}\n</urlset>\n`
    );
  }
}
