import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/drizzle/migrations/**",
      "test/**/*.js",
      "eslint.config.mjs",
      "vitest.config.mjs",
      "vitest.integration.config.mjs",
      "drizzle.config.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowWithDecorator: true },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    // Integration tests assert on dynamic JSON (supertest `res.body` is `any`).
    files: ["test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  eslintConfigPrettier,
);
