// This file intentionally violates the Plane A vs Bronze boundary for testing purposes.
// Plane A module requiring a Bronze module (should be forbidden by ESLint rule).
// We do not actually execute this code; it is a static analysis test.

import bronzeUtil from "../storage/bronze/bronzeUtil.js";
// This import from a Bronze-scoped module is not allowed for Plane A code.
// ESLint should flag this with a "boundaries/element-types" error, enforcing that
// raw Bronze data must never be accessed directly by Plane A (Golden Rule).

// Dummy usage to avoid unused variable errors.
console.log("[Test] Bronze Util:", bronzeUtil);
