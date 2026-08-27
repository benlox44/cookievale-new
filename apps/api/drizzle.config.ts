import { defineConfig } from "drizzle-kit";

const url = process.env["DATABASE_URL"];
if (url === undefined || url === "") {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

export default defineConfig({
  schema: "./src/shared/drizzle/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
