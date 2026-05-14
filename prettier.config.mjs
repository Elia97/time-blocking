/** @type {import("prettier").Config} */
export default {
  semi: false,
  singleQuote: false,
  printWidth: 100,
  trailingComma: "all",
  tabWidth: 2,
  arrowParens: "always",
  plugins: ["prettier-plugin-tailwindcss"],
  overrides: [
    {
      files: "*.md",
      options: { proseWrap: "preserve" },
    },
  ],
}
