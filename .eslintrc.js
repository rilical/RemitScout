/**
 * ESLint configuration - Enforce module boundaries for planes and data layers.
 * This helps achieve compliance by construction by preventing disallowed cross-boundary calls.
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["boundaries", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
    // If using a framework or TS, extend its recommended config here.
  ],
  settings: {
    "boundaries/elements": [
      // Define our architectural element patterns and tag them with scopes.
      { pattern: "backend/plane-a/**", tags: ["scope:plane-a-product"] },
      { pattern: "backend/plane-b/**", tags: ["scope:plane-b-ingestion"] },
      { pattern: "backend/plane-c/**", tags: ["scope:plane-c-publishing"] },
      { pattern: "backend/storage/bronze/**", tags: ["scope:bronze", "scope:storage-bronze"] }
      // Patterns can be adjusted once actual folder structure is set in Phase 1.
    ],
    "boundaries/ignore": [
      "**/node_modules/**",
      "**/secrets/**" // Ignore secrets directory from linting.
    ]
  },
  rules: {
    // Enable the core boundaries rule to disallow forbidden imports.
    "boundaries/element-types": ["error", {
      default: "allow", // Allow imports unless restricted below.
      rules: [
        {
          from: ["scope:plane-a-product"],
          disallow: ["scope:bronze"]
          // Plane A code cannot import anything tagged as Bronze (raw data access).
        }
        // Add rules to restrict other cross-plane imports as needed.
      ]
    }]
  }
};
