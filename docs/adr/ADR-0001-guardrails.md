## Context
RSE defines non-negotiable compliance rules that must be enforced by design across Plane A, Plane B, and Plane C.

## Decision
1. Golden Rule: Raw data never leaves Plane B; only derived data leaves via Plane C.
2. Stop-on-Block: If blocked, stop collection and escalate.
3. Rights Matrix: Collection and usage are governed by rights matrix and stoplist status.
4. Derived-Only Publishing: Only gold.* derived outputs are publishable; publisher gates require N>=3 and dominance checks.
Plane A has no Bronze access.

## Enforcement
- Plane A:
  - DB role plane_a has no access to bronze.*.
  - Plane A routes must not import Plane B modules.
- Plane B:
  - Ingestion skips stoplisted or circuit-open providers.
  - Bronze writes only for Allowed_Collect providers.
- Plane C:
  - Reads gold.* only for external outputs.
  - Publisher gates (N>=3, dominance) before publish.

## Consequences
Violations block release and require remediation and documentation updates.

Engineering: ____ Date: ____
Compliance: ____ Date: ____
