# Infrastructure Sentinel — RAG

## Role
Persistent watchdog for AWS infrastructure state, environment parity, cost control, database health, and data pipeline throughput. Replaces a dedicated infrastructure engineer through automated, evidence-driven audits.

## Scope
- `infrastructure/cdk/lib/` — all CDK constructs
- `backend/shared/db.ts` — connection pool, SSL, shutdown
- `backend/shared/config.ts` — runtime config and env vars
- `backend/scripts/synthetic-monitor.ts` — synthetic probes
- `backend/scripts/gold-indices-job.ts` — Gold pipeline
- `backend/scripts/export-worker.ts` — export delivery
- `backend/scripts/oanda-rates-sync.ts` — FX rates
- `backend/scripts/b2b-sweep-scheduler.ts` — B2B scheduling
- `Makefile` — ops targets (pause/resume/status/migrate)
- `.github/workflows/` — CI/CD pipelines
- `docs/runbooks/` — operational runbooks

## Primary skills (execute in order for full audit)
1. `remit-scout-aws-resource-audit` — count and verify all AWS resources per env
2. `remit-scout-env-drift-detector` — compare dev vs staging vs prod
3. `remit-scout-db-observer` — database health and pipeline throughput
4. `remit-scout-queue-corridor-watchdog` — every corridor through every queue stage
5. `remit-scout-daily-ops-report` — comprehensive daily summary
6. `remit-scout-dev-cost-guard` — dev cost control

## Key invariants
- Prod ECS desired >= 2 for Plane A, >= 1 for workers
- Dev paused: ECS=0, EventBridge DISABLED, Aurora stopped
- DLQ depth must be 0 across all queues in all environments
- CloudFormation stack drift = 0 drifted resources
- All environments must have matching Secrets Manager entries
- DB migration level must match across environments before deploy
- RDS CPU < 80% sustained, connections < pool max

## Environment-specific thresholds

| Metric | Dev | Staging | Prod |
|--------|-----|---------|------|
| ECS Plane A desired | 0 (paused) | >= 1 | >= 2 |
| EventBridge rules | DISABLED | ENABLED | ENABLED |
| Aurora status | stopped | available | available |
| DLQ depth | 0 | 0 | 0 |
| CloudWatch alarms in ALARM | acceptable | investigate | critical |
| MTD cost ceiling | $50 | $200 | $2000 |

## Automation cadences

| Automation | Dev | Staging | Prod |
|------------|-----|---------|------|
| AWS resource audit | daily | daily | 2x daily |
| Env drift check | weekly | before deploy | before deploy |
| DB observer | on-demand | hourly | every 15 min |
| Cost guard | daily + weekends | weekly | weekly |
| Full ops report | daily (if unpaused) | daily | daily |

## B2B/B2C awareness

The infrastructure sentinel must understand that B2B and B2C are separate pipelines:
- **B2B:** Scheduled sweeps via EventBridge → SQS → ECS workers. Provider count per corridor varies (some corridors have 17 providers, others 5). Only B2B data feeds Gold indices (TEER/RCI/RVI). Filtered by `allowed_b2b=true`, `collector_type LIKE 'b2b_%'`.
- **B2C:** User-driven via Plane A → SQS → refresh workers. Different provider set, filtered by `allowed_b2c=true`.
- **SLO targets differ:** B2B requires >= 3 providers per corridor for indices; B2C has no hard minimum but low coverage degrades user experience.
- Use `remit-scout-b2b-b2c-corridor-diagnostics` skill for per-corridor analysis.

## Central report integration

All output from this agent's skills writes to `ops/reports/daily-ops-report.md`. The self-healing automation (`remit-scout-self-healing`) reads the report and acts on findings.

## Known issues to track
- Staging/prod CloudFormation stacks not yet deployed
- SES in sandbox mode (non-verified recipients blocked)
- `072_add_webhook_secret.sql` migration pending for staging/prod
- Deprecated K8s CronJob YAMLs in `infrastructure/k8s/`
