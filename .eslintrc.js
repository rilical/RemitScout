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
      // Define our architectural element patterns and tag them with types.
      { pattern: "backend/plane-a/**", type: "plane-a" },
      { pattern: "plane-a/**", type: "plane-a" },
      { pattern: "backend/plane-b/**", type: "plane-b" },
      { pattern: "plane-b/**", type: "plane-b" },
      { pattern: "backend/plane-c/**", type: "plane-c" },
      { pattern: "plane-c/**", type: "plane-c" },
      { pattern: "backend/shared/**", type: "shared" },
      { pattern: "shared/**", type: "shared" },
      { pattern: "backend/storage/bronze/**", type: "bronze" },
      { pattern: "storage/bronze/**", type: "bronze" }
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
          from: ["plane-a"],
          disallow: ["bronze"]
          // Plane A code cannot import anything tagged as Bronze (raw data access).
        }
        // Add rules to restrict other cross-plane imports as needed.
      ]
    }]
  }
};
