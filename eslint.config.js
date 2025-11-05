module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    // Prettier integration
    "prettier/prettier": [
      "error",
      {
        singleQuote: true,
        semi: true,
        trailingComma: "all",
        printWidth: 100,
        tabWidth: 2,
      },
    ],

    // 🧠 TS/ESLint rules
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-console": "off",
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "*.config.js",
    "*.config.cjs",
  ],
};
