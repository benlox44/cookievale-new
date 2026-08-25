import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { loadConfig } from "../config/env";

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  readonly db: PostgresJsDatabase;

  private readonly client: Sql;

  constructor() {
    const config = loadConfig();
    this.client = postgres(config.databaseUrl);
    this.db = drizzle(this.client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.end();
  }
}
