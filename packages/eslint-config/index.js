/** Shared ESLint baseline for the monorepo (extend per app as needed). */
module.exports = {
  root: false,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: ["dist", ".next", "node_modules"],
};
