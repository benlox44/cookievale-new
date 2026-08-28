import { defineConfig } from "vitest/config";

export default defineConfig({
  // Prefer .ts so a stray compiled .js next to a source file is never resolved.
  resolve: { extensions: [".ts", ".mts", ".js", ".mjs", ".json"] },
  test: {
    include: ["test/**/*.int-spec.ts"],
    globalSetup: ["test/setup/global-setup.ts"],
    setupFiles: ["test/setup/env.setup.ts"],
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
