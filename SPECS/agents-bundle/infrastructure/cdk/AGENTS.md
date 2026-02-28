---
entrypoints:
  - "infrastructure/cdk/lib/remit-scout-stack.ts"
  - "infrastructure/cdk/lib/monitoring.ts"
  - "infrastructure/cdk/lib/queues.ts"
evidence_skills:
  - "evidence.queue_backlog.github_actions"
common_reason_codes:
  - "queue.dlq_nonzero"
---
# Infrastructure CDK (AGENTS)

What this directory is:
AWS infrastructure definition (CDK app + stacks + env wiring).

Entrypoints:
- `infrastructure/cdk/lib/remit-scout-stack.ts`
- `infrastructure/cdk/lib/monitoring.ts`
- `infrastructure/cdk/lib/queues.ts`

Common failure modes:
- Alarm thresholds mismatched to SLO targets.
- OIDC role/region vars missing in GitHub environments.
- DLQ alarms not breaching on missing data.

Evidence skills to run:
- `evidence.queue_backlog.github_actions`

Do-not-break rules:
- Keep plane boundaries explicit (no cross-plane secret leakage).
- Avoid high-cardinality CloudWatch dimensions by default.

