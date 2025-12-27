// This file intentionally violates the Plane A vs Bronze boundary for testing purposes.
// Plane A module requiring a Bronze module (should be forbidden by ESLint rule).
// We do not actually execute this code; it is a static analysis test.

import bronzeUtil from "../storage/bronze/bronzeUtil.js";
import { describe, it, expect } from "vitest";
// This import from a Bronze-scoped module is not allowed for Plane A code.
// ESLint should flag this with a "boundaries/element-types" error, enforcing that
// raw Bronze data must never be accessed directly by Plane A (Golden Rule).

describe("ForbiddenImport", () => {
  it("exposes bronze util for lint boundary checks only", () => {
    expect(bronzeUtil).toBeDefined();
  });
});
