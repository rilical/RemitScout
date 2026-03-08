# Provider Onboarding — RAG

## Role
Automate horizontal scaling by providing a repeatable, deterministic workflow for adding new remittance providers to Remit-Scout. Handles both B2B and B2C providers with full infrastructure wiring.

## Scope
- `backend/plane-b/src/providers/` — all existing providers (template reference; canonical list in `.remit-scout/providers/catalog.json`)
- `backend/plane-b/src/providers/index.ts` — provider registry
- `backend/shared/config.ts` — provider config section
- `backend/db/migrations/` — migration files for new providers
- `infrastructure/cdk/lib/scheduled-jobs.ts` — probe Lambda definitions
- `infrastructure/cdk/lib/ecs-tasks.ts` — ECS task env vars
- `infrastructure/cdk/lib/remit-scout-stack.ts` — secret wiring
- `silver.provider` — provider table
- `silver.rights_matrix` — corridor permissions and status
- `silver.provider_corridor_capability` — method capabilities

## Primary skills
1. `remit-scout-provider-onboarding` — zero-touch onboarding contract and execution loop
2. `provider.onboarding.local` — deterministic local orchestrator entrypoint (`pnpm -C backend provider:onboarding-orchestrator`)
3. `remit-scout-provider-health-probe` — post-onboarding health validation

## Current provider registry (24)
Canonical inventory lives in `.remit-scout/providers/catalog.json`.

remitly, westernunion, worldremit, instarem, wirebarley, alansari, intermex, xoom, xe, transfergo, paysend, pangea, orbitremit, bossmoney, koronapay, remitbee, singx, placid, ria, dahabshiil, sendwave, mukuru, wise, wellsfargo

## Onboarding loop phases (deterministic)
1. **Contract ingest** — parse `providers[]` payload (curl templates, countries/currencies/corridors, env context).
2. **Preflight validation** — enforce auth headers, ISO code validity, and hard-stop blocker checks.
3. **Synthetic catalog** — derive bounded corridor test set when `corridors[]` is empty.
4. **Scaffold + probes** — run `provider:scaffold`, `probe:provider`, `evidence:provider-health`.
5. **Capability checks** — run canary capability seed + capability probe + capability evidence.
6. **B2C smoke** — run `ci:api-smoke` for B2C/BOTH providers.
7. **Scoring + review** — compute Remit-Score, emit review card, reason codes, and next skill IDs.

## Provider lifecycle states
- `candidate` — newly onboarded, collecting but not in indices
- `sandbox` — testing with limited corridors
- `beta` — expanded corridors, may appear in some queries
- `production` — fully active, contributes to TEER/RCI/RVI
- `deprecated` — being phased out

## B2B vs B2C differences

| Aspect | B2B | B2C |
|--------|-----|-----|
| Collection trigger | EventBridge schedule | User-driven SQS request |
| Collector type | `b2b_*` | `b2c_*` |
| Sweep scheduler | `b2b-sweep-scheduler.ts` | On-demand via Plane A |
| Rights-matrix flags | `allowed_b2b=true` | `allowed_b2c=true` |
| Tier assignment | From `corridor_tier_snapshot` | N/A (real-time) |
| Gold contribution | Via weighting job | Via weighting job (if production) |

## Key invariants
- New providers must start as `candidate` — never deploy directly to `production`
- Rights-matrix entries must have explicit corridor lists — NULL/empty must NOT match all
- Amount normalization to $500 USD equivalent is required
- Probe Lambda must be tagged `managed-by: ops-pause` for dev pause compatibility
- Provider-specific secrets go to Secrets Manager, never env vars or code
- Onboarding artifacts must always include non-empty `ci_ref` and `review_card`.
- Remit-Score onboarding weights are fixed: Delivered Value 40, Reliability/Success 20, Friction/Speed 15, Support/Refunds 15, Trust/Safety 10.
- Required onboarding reason-code coverage: `provider_onboarding.input_invalid`, `provider_onboarding.scaffold_fail`, `provider_onboarding.probe_timeout`, `provider_onboarding.smoke_fail`, `provider_onboarding.score_below_threshold`, `provider_onboarding.review_blocked`.

## Post-onboarding checklist
- [ ] Provider appears in `remit-scout-provider-health-probe` output
- [ ] Silver receives quotes within expected cadence
- [ ] No DLQ messages from provider's ingestion
- [ ] Gold weighting snapshot includes provider after promotion
- [ ] Smoke test returns provider data for expected corridors
- [ ] Export includes provider quotes in corridor history

## Template provider (use as reference)
Best template for new B2B provider: `backend/plane-b/src/providers/remitly/`
Best template for new B2C provider: `backend/plane-b/src/providers/wise/`

## Provider count awareness

Provider counts per corridor are NOT fixed:
- A US→MX corridor might have 17 B2B providers, while US→PH has 12
- The RVI/TEER/RCI counts depend on which providers have `status='production'` AND `allowed_in_rvi/teer/rci=true` for that specific corridor
- When onboarding a new provider, it initially has 0 corridors — use `candidate` status and gradually expand
- After promotion, verify the provider appears in the correct corridor counts using `remit-scout-b2b-b2c-corridor-diagnostics`

## Self-healing integration

After onboarding, the self-healing automation will:
1. Detect the new provider in the next provider health probe cycle
2. Verify Silver is receiving quotes for expected corridors
3. Flag if the provider is underperforming vs its rights matrix coverage
4. After promotion, verify Gold weighting includes the new provider

All findings write to `ops/reports/daily-ops-report.md`.
