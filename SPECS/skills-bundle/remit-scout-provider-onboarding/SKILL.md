---
name: remit-scout-provider-onboarding
description: Zero-touch provider onboarding loop for Remit-Scout. Runs scaffold, probes, evidence, B2C smoke, Remit-Score, and review payload generation from one v1 contract.
---

# remit-scout-provider-onboarding

## Execution Entry

Run locally:

```bash
pnpm -C backend provider:onboarding-orchestrator --input <payload.json>
```

Primary implementation:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/provider-onboarding-orchestrator.ts`

Primary contract spec:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/SPECS/skills-bundle/remit-scout-provider-onboarding/SKILL.md`

## Required Provider Payload Fields

Each `providers[]` entry must include:
- `provider_slug`
- `provider_name`
- `provider_type` (`B2B|B2C|BOTH`)
- `curl_requests[]` with auth headers
- `supported_countries[]` (ISO2)
- `supported_currencies[]` (ISO4217)

Optional:
- `corridors[]`
- `operator_notes`

Top-level options:
- `execution_env` (`staging` default)
- `ci_ref`
- `dry_run`
- `staging_only`
- `auto_merge`
- `continue_on_error`
- `corridor_limit`
- `score_threshold`
- `command_timeout_ms`
- `smoke_base_url`

## Fixed Remit-Score Weights

- Delivered Value: `40`
- Reliability/Success: `20`
- Friction/Speed: `15`
- Support/Refunds: `15`
- Trust/Safety: `10`

These match:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/frontend/pages/methodology.vue`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/frontend/pages/learn/how-remit-score-works.vue`

## Onboarding Reason Codes

- `provider_onboarding.input_invalid`
- `provider_onboarding.scaffold_fail`
- `provider_onboarding.probe_timeout`
- `provider_onboarding.smoke_fail`
- `provider_onboarding.score_below_threshold`
- `provider_onboarding.review_blocked`

## Output Artifact

- `artifacts/provider-onboarding/<run_id>/provider-onboarding-run.json`

Includes:
- consolidated run status
- per-provider artifacts/evidence/reason codes
- remit-score breakdown
- review card
- next skill IDs
