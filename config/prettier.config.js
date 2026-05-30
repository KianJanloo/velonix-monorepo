/** @type {import("prettier").Config} */
const config = {
  // Print width — 100 chars is comfortable for modern monitors
  printWidth: 100,
  // 2-space indentation
  tabWidth: 2,
  useTabs: false,
  // Always use double quotes for consistency
  singleQuote: false,
  // Trailing commas in ES5+ positions
  trailingComma: "es5",
  // Always include semicolons
  semi: true,
  // Always include parens around arrow function params
  arrowParens: "always",
  // Keep JSX attributes on same line when they fit
  jsxSingleQuote: false,
  // Line endings
  endOfLine: "lf",
  // Plugin overrides
  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: { printWidth: 120 },
    },
    {
      files: ["*.md"],
      options: { proseWrap: "always" },
    },
  ],
};

module.exports = config;
