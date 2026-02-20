# Disaster Recovery Runbook

## Scope
- Plane A public API
- Plane B ingestion and queue workers
- Plane C publisher and exports
- Data stores: Aurora (Plane A/B/C), Redis, S3 buckets

## RTO / RPO Targets
- `RTO`: 60 minutes for full API restoration in staging/prod.
- `RPO`: 15 minutes for quote/indices freshness pipelines, 24 hours for non-critical analytics surfaces.

## Preconditions
- Confirm current on-call incident commander.
- Confirm latest successful backup window and rollback-drill evidence.
- Confirm DNS ownership and Route53 change access.

## Region Failover Sequence
1. Declare DR incident and freeze deployments.
2. Validate primary-region blast radius and decide failover.
3. Restore Aurora snapshot in target region (latest consistent recovery point).
4. Restore Redis/queue infrastructure from IaC (`cdk deploy` with DR context).
5. Rehydrate required S3 artifacts and verify bucket encryption/policies.
6. Run migrations forward-only against restored DB.
7. Run smoke checks:
   - `/healthz`
   - `/readyz`
   - `/metrics`
   - one quote corridor check
8. Shift DNS/CloudFront origins to DR region endpoints.
9. Monitor p95/p99, 5xx, DLQ depth, and freshness SLO for 30 minutes before closing incident.

## Data Restore Order
1. Aurora cluster restore.
2. Secrets/SSM parameter validation.
3. Redis restore/rebuild.
4. Queue topology restore and DLQ policy validation.
5. Scheduled jobs re-enable.

## Post-cutover Verification
- Plane A quote endpoint returns non-empty payload for known corridor.
- Plane C `/internal/publisher/validate` passes with internal auth.
- `gold-live` queue age under threshold.
- No critical alarms firing for 15 minutes.

## DR Evidence Checklist
- `RTO` achieved (minutes):
- `RPO` achieved (minutes):
- Last tested date (UTC):
- Restore success log artifact URL:
- Incident commander signoff:

## Drill Cadence
- Weekly rollback drill remains scheduled via `cd/rollback-drill`.
- Quarterly full DR simulation is required for staging.

