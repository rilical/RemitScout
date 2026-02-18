---
entrypoints:
  - "infrastructure/cdk/lib/monitoring.ts"
  - "infrastructure/cdk/lib/scheduled-jobs.ts"
  - "infrastructure/cdk/lib/synthetics.ts"
evidence_skills:
  - "evidence.http_latency.github_actions"
common_reason_codes:
  - "http.timeout_rate_high"
---
# Infrastructure CDK Lib (AGENTS)

What this directory is:
CDK library modules for queues, monitoring, scheduled jobs, synthetics, and IAM.

Entrypoints:
- `infrastructure/cdk/lib/monitoring.ts`
- `infrastructure/cdk/lib/scheduled-jobs.ts`
- `infrastructure/cdk/lib/synthetics.ts`

Common failure modes:
- Scheduled jobs disabled in one env causing silent freshness drift.
- Synthetics failing but not routed into Cases.

Evidence skills to run:
- `evidence.http_latency.github_actions`

Do-not-break rules:
- Missing data in prod/staging should generally breach for SLO alarms.

