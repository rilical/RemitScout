---
name: remit-scout-provider-onboarding
description: Zero-touch provider onboarding loop for Codex/Claude. Ingests provider curl specs + coverage, scaffolds provider artifacts, runs probes/evidence/smoke, computes Remit-Score, and emits review-ready run artifacts with reason codes.
contract_version: v1
---

# Zero-Touch Provider Loop (Execution Spec)

This skill is executable via:

```bash
pnpm -C backend provider:onboarding-orchestrator --input <payload.json>
```

Primary implementation:
- `backend/scripts/provider-onboarding-orchestrator.ts`

## 1) Input Contract (v1)

Required top-level fields:
- `providers`: array of provider onboarding jobs

Optional top-level fields:
- `execution_env`: `dev|staging|prod` (default `staging`)
- `ci_ref`: commit/context ref (fallback order: `--ci_ref` -> payload -> `GITHUB_SHA` -> `GITHUB_RUN_ID` -> generated token)
- `operator_notes`: free-form context
- `dry_run`: boolean (default `false`)
- `staging_only`: boolean (default `false`)
- `auto_merge`: boolean (default `false`)
- `continue_on_error`: boolean (default `true`)
- `corridor_limit`: integer (default `10`, bounded)
- `score_threshold`: number (default `7.0`)
- `command_timeout_ms`: integer (default `90000`)
- `smoke_base_url`: URL for B2C smoke (`API_BASE_URL` fallback)

Each provider entry must include:
- `provider_slug`
- `provider_name`
- `provider_type`: `B2B|B2C|BOTH`
- `curl_requests[]`: `{ method, url, headers, body, assertions }`
- `supported_countries[]`: ISO2 list
- `supported_currencies[]`: ISO4217 list

Optional provider fields:
- `corridors[]`: `SEND-RECV-SENDCUR-RECVCUR`
- `operator_notes`

### Hard input validation rules
- Missing/invalid required fields -> `provider_onboarding.input_invalid`
- Missing auth header in curl templates (`authorization`, `x-api-key`, `apikey`, `x-auth-token`, `proxy-authorization`) -> `provider_onboarding.input_invalid`
- Invalid country/currency codes -> `provider_onboarding.input_invalid`

## 2) Deterministic Step Order

Per run:
1. Parse + validate payload
1. Enforce environment rules (`staging_only` gate)
1. Derive synthetic corridors where `corridors` is empty
1. Persist synthetic catalog artifacts
1. For each provider, execute in order:
   - `provider:scaffold`
   - `probe:provider`
   - `evidence:provider-health`
   - `ci:api-smoke` (B2C/BOTH only)
1. Global capability validation:
   - `capability:seed-canary`
   - `capability:probe`
   - `evidence:provider-capability-probe`
1. Compute Remit-Score + review card
1. Emit consolidated run output + per-provider artifacts + reason codes

## 3) Branch-Aware Behavior

- `dry_run=true`
  - No scaffold/probe/evidence/smoke commands are executed.
  - Synthetic catalogs + score/review artifacts are still emitted.

- `staging_only=true`
  - Hard stop unless `execution_env=staging`.

- `auto_merge=true`
  - No merge is executed by this skill.
  - Review card `next_action` is set to auto-merge-aware promotion text.

- `continue_on_error=false`
  - First blocked provider halts execution for remaining providers in the batch.
  - Remaining providers are emitted as blocked/skip artifacts with explicit reason context.

## 4) Blockers vs Warnings

Hard blockers (review becomes `blocked`):
- `provider_onboarding.input_invalid`
- `provider_onboarding.scaffold_fail`
- `provider_onboarding.probe_timeout`
- `provider_onboarding.smoke_fail`
- `provider_onboarding.score_below_threshold`

Warnings:
- Non-blocking evidence anomalies inherited from evidence payloads
- Dry-run notice

Blocked runs must include:
- `provider_onboarding.review_blocked`

## 5) Remit-Score Contract

Remit-Score is computed using frontend-aligned fixed weights:
- Delivered Value: `40`
- Reliability/Success: `20`
- Friction/Speed: `15`
- Support/Refunds: `15`
- Trust/Safety: `10`

Source alignment:
- `frontend/pages/methodology.vue`
- `frontend/pages/learn/how-remit-score-works.vue`

Output includes:
- `remit_score.total` (0-10)
- `remit_score.threshold`
- `remit_score.breakdown` with per-dimension `weight`, `score`, `note`

## 6) Output Contract (Canonical)

Top-level run artifact (`artifacts/provider-onboarding/<run_id>/provider-onboarding-run.json`):
- `run_id`
- `stage`
- `ci_ref`
- `execution_env`
- `status`
- `artifact_paths[]`
- `evidence_paths[]`
- `reason_codes[]`
- `remit_score` (aggregate)
- `review_card` (single gate state)
- `next_skill_ids[]`
- `providers[]` (per-provider outputs)

Per-provider output contract:
- `run_id`
- `stage`
- `ci_ref`
- `provider_slug`
- `status`
- `artifact_paths[]`
- `evidence_paths[]`
- `reason_codes[]`
- `remit_score`
- `review_card`
- `next_skill_ids[]`

## 7) Reason-Code Coverage

Required onboarding reason codes:
- `provider_onboarding.input_invalid`
- `provider_onboarding.scaffold_fail`
- `provider_onboarding.probe_timeout`
- `provider_onboarding.smoke_fail`
- `provider_onboarding.score_below_threshold`
- `provider_onboarding.review_blocked`

## 8) Evidence + Review Integration

The run emits:
- One consolidated run artifact
- Per-provider artifacts/logs
- Provider health evidence payloads
- Capability probe evidence payload
- Review card object with blockers/warnings for admin consumption

## 9) Metrics + Ops Hooks

The orchestrator emits CloudWatch metrics under `RemitScout/Onboarding`:
- `provider_onboarding_run_count`
- `provider_onboarding_provider_count`
- `provider_onboarding_provider_status`
- `provider_onboarding_remit_score`

## 10) Example Invocation

```bash
pnpm -C backend provider:onboarding-orchestrator \
  --input artifacts/provider-onboarding-input.json \
  --execution_env staging \
  --ci_ref 97862e7 \
  --corridor_limit 10 \
  --score_threshold 7
```

## 11) Expected Acceptance Signals

- Invalid payload fails early with `provider_onboarding.input_invalid`
- Derived corridors are logged when `corridors[]` omitted
- B2C smoke failures map to `provider_onboarding.smoke_fail`
- Timeout paths map to `provider_onboarding.probe_timeout`
- Every provider gets isolated artifacts and review status
- `ci_ref` is always non-empty in emitted artifacts
