---
entrypoints:
  - "infrastructure/cdk/AGENTS.md"
  - "infrastructure/cdk/lib/AGENTS.md"
  - "infrastructure/cdk/lib/monitoring.ts"
evidence_skills:
  - "evidence.queue_backlog.github_actions"
  - "evidence.http_latency.github_actions"
common_reason_codes:
  - "queue.dlq_nonzero"
  - "http.timeout_rate_high"
---
# Infrastructure (AGENTS)

What this directory is:
AWS IaC, monitoring/alarms, scheduled jobs, and environment wiring.

Entrypoints:
- `infrastructure/cdk/AGENTS.md`
- `infrastructure/cdk/lib/AGENTS.md`
- `infrastructure/cdk/lib/monitoring.ts`

Common failure modes:
- Alarm TreatMissingData configured incorrectly (missing == ok).
- Schedules disabled in one env causing silent freshness drift.

Evidence skills to run:
- `evidence.queue_backlog.github_actions`
- `evidence.http_latency.github_actions`

Do-not-break rules:
- Avoid high-cardinality CloudWatch metrics unless explicitly enabled.

