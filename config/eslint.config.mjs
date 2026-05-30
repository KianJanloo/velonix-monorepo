// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      // Allow underscore-prefixed unused variables (common pattern for ignored params)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Allow explicit any in rare cases (Three.js material overrides, etc.)
      "@typescript-eslint/no-explicit-any": "warn",
      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Allow non-null assertions in rare cases
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      // No floating promises
      "@typescript-eslint/no-floating-promises": "error",
      // Require await on async functions
      "@typescript-eslint/require-await": "error",
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Relax rules for config files themselves
    files: ["**/*.config.{js,ts,mjs}", "**/postcss.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
    ],
  }
);
