## Golden Rule
TODO:

## Stop-on-Block
TODO:

## Rights Matrix
The rights matrix controls collection and usage permissions per provider. It is enforced
by Plane B before collectors run and by Plane C publish gates for B2B outputs.

Provider | allowed_collect | allowed_b2c | allowed_b2b | stoplist_status | collection_method | Notes
--- | --- | --- | --- | --- | --- | ---
remitly | true | true | true | active | http | seed:S3.0
wise | true | true | true | active | http | seed:S3.0
westernunion | true | true | true | active | http | seed:S3.0
worldremit | true | true | true | active | http | seed:S3.0
xe | true | true | true | active | http | seed:S3.0

## Derived-Only Publishing
TODO:

## Enforcement Points
| Rule | Plane A enforcement | Plane B enforcement | Plane C enforcement | Evidence/Test |
| --- | --- | --- | --- | --- |
| Golden Rule | plane_a role has no access to bronze.* per backend/db/migrations/001_init.sql; Plane A routes must not import Plane B modules from backend/plane-b | ingestion writes to Bronze only for Allowed_Collect providers in backend/plane-b/src/ingest.ts | Plane C reads only gold.* tables and does not expose Bronze or Silver directly | backend/tests/guardrails.test.ts |
| Stop-on-Block | Plane A does not trigger collection and has no Plane B imports in backend/plane-a/src/routes | backend/plane-b/src/ingest.ts skips providers when stoplisted or circuit open | Plane C serves derived outputs only after publisher gates | TODO: stoplist-enforcement.test.ts |
| Rights Matrix | Plane A serves data from Silver/Gold only; no Bronze access | backend/plane-b/src/ingest.ts filters by Allowed_Collect from rights matrix | Plane C checks Allowed_B2B before publishing derived datasets | TODO: rights-matrix-enforcement.test.ts |
| Derived-Only Publishing | Plane A reads Silver/Gold only and never reads Bronze | Plane B writes Bronze and Silver but does not publish externally | Plane C applies publisher gates (N>=3, dominance) and reads gold.* only | TODO: publisher-gates.test.ts |

## Tests
### Local commands
```sh
RUN_BRONZE_GUARDRAIL_TEST=1 DATABASE_URL_PLANE_A=postgres://plane_a:plane_a@localhost:5432/remit pnpm -C backend test
```
Expected: permission denied or insufficient privilege on bronze read.

### Guardrail: Plane A cannot read Bronze
- File: backend/tests/guardrails.test.ts
- Command: RUN_BRONZE_GUARDRAIL_TEST=1 DATABASE_URL_PLANE_A=postgres://plane_a:plane_a@localhost:5432/remit pnpm -C backend test
- Expected: permission denied

### Guardrail Tests
- backend/tests/guardrails.test.ts: verifies Plane A cannot read bronze.* tables.
- backend/tests/gold-export-guardrails.test.ts: documents Gold-only export requirement.
- Command: RUN_BRONZE_GUARDRAIL_TEST=1 DATABASE_URL_PLANE_A=postgres://plane_a:plane_a@localhost:5432/remit pnpm -C backend test
