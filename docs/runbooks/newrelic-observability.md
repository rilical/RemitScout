# New Relic Observability Runbook (Staging + Prod)

Last updated: 2026-02-26

## Purpose

Canonical steps to keep Remit-Scout New Relic dashboards and alert mirrors consistent across staging and production.

CloudWatch remains rollback-alarm source of truth. New Relic is now a hard promotion gate for observability readiness in staging/prod.

## Required environment variables

```bash
export NEW_RELIC_USER_API_KEY=...
export NEW_RELIC_ACCOUNT_ID=7756888
export NEW_RELIC_REGION=US
export NEW_RELIC_INGEST_KEY=...
export NEW_RELIC_LOGS_ENABLED=1
export NEW_RELIC_STAGING_AWS_MODE=push_pull
export NEW_RELIC_PROD_AWS_MODE=otlp_only
export NEW_RELIC_STAGING_AWS_ACCOUNT_ID=010630709504
export NEW_RELIC_PROD_AWS_ACCOUNT_ID=938998270127
export NEW_RELIC_STAGING_AWS_ROLE_ARN=arn:aws:iam::010630709504:role/NewRelicInfrastructure-Integrations-RemitScout
export NEW_RELIC_PROD_AWS_ROLE_ARN=arn:aws:iam::938998270127:role/NewRelicInfrastructure-Integrations-RemitScout
```

## Runtime telemetry requirements

Backend services (Plane A/B/C + workers) must have:

```bash
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=<optional override; defaults by NEW_RELIC_REGION in staging/prod>
OTEL_EXPORTER_OTLP_HEADERS=api-key=<NEW_RELIC_INGEST_KEY>
# or set NEW_RELIC_INGEST_KEY directly and omit OTEL_EXPORTER_OTLP_HEADERS
NEW_RELIC_LOGS_ENABLED=1
```

Default OTLP trace endpoint by region (when endpoint override is not supplied):
- `US`: `https://otlp.nr-data.net/v1/traces`
- `EU`: `https://otlp.eu01.nr-data.net/v1/traces`

## Metric namespace map (custom metrics)

Use namespace-aware NRQL filters; avoid single exact metric-name assumptions:

- `RemitScout`: `slo_*`, `indices_*`, `oanda_sync_failures_total`, `db_connection_pool_waiting`, `worker_backpressure_active`
- `RemitScout/Business`: `telemetry_*`, `export_jobs_completed`, `export_jobs_failed`
- `RemitScout/Workers`: `message_failed`, `dlq_sent`, `lock_failed`, `envelope_parse_error`, `stale_dropped`
- `RemitScout/Probes`: `probe_*`
- `RemitScout/Collectors`: `collector_*`

AWS-native metrics should be filtered by `aws.Namespace` plus tolerant metric-name fragments (not one exact prefixed token).

## Step 1: Upsert dashboards

```bash
node ops/newrelic/bootstrap-dashboards.mjs
```

Expected:
- `Remit-Scout Staging Ops`
- `Remit-Scout Production Ops`

New dedicated pages (kept alongside existing pages):
- `Indices (TEER/RCI/RVI)`
- `Exports Health`
- `API Health`
- `Provider Health (Per Provider)`

## Step 1a: Full bootstrap (preferred)

If provisioning a fresh account or reconciling drift, run this once:

```bash
NEW_RELIC_ALERT_EMAIL=alerts@remit-scout.com node ops/newrelic/bootstrap-all.mjs
```

It upserts dashboards, mirrored alerts, workloads, and incident workflows in one pass.

## Step 2: Upsert mirrored alert policies

```bash
node ops/newrelic/sync-alerts.mjs
```

Expected policies:
- `Remit-Scout STAGING CloudWatch Mirror`
- `Remit-Scout PROD CloudWatch Mirror`

Each policy should contain 5 static NRQL conditions:
- `api-error-rate-high (mirror)`
- `api-p99-latency-high (mirror)`
- `dlq-depth-high (mirror)`
- `slo-breach-total (mirror)`
- `provider-probe-failures-high (mirror)`

## Step 3: Link AWS accounts to New Relic

For each AWS env account, create role `NewRelicInfrastructure-Integrations-RemitScout` with:
- trusted principal: `arn:aws:iam::754728514883:root`
- external id: `7756888`

Attach at least:
- `arn:aws:iam::aws:policy/ReadOnlyAccess`
- `arn:aws:iam::aws:policy/AWSSupportAccess`

Then run:

```bash
NEW_RELIC_STAGING_AWS_ROLE_ARN=arn:aws:iam::010630709504:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_PROD_AWS_ROLE_ARN=arn:aws:iam::938998270127:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_STAGING_AWS_MODE=push_pull \
NEW_RELIC_PROD_AWS_MODE=otlp_only \
node ops/newrelic/sync-cloud-links.mjs
```

Reconcile command (recommended in staging-full and prod promotion windows):

```bash
NEW_RELIC_STAGING_AWS_ROLE_ARN=arn:aws:iam::010630709504:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_PROD_AWS_ROLE_ARN=arn:aws:iam::938998270127:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_STAGING_AWS_MODE=push_pull \
NEW_RELIC_PROD_AWS_MODE=otlp_only \
node ops/newrelic/sync-cloud-links.mjs
```

This upserts:
- staging `PUSH` + `PULL` links when `NEW_RELIC_STAGING_AWS_MODE=push_pull`
- prod/staging link removal when the env mode is `otlp_only`
- API polling integrations needed by Remit-Scout
- metadata/tags integrations for stream mode

If drift is detected, the script fails closed. To auto-repair drifted links in-place:

```bash
NEW_RELIC_REPAIR_DRIFTED_LINKS=1 \
NEW_RELIC_STAGING_AWS_ROLE_ARN=arn:aws:iam::010630709504:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_PROD_AWS_ROLE_ARN=arn:aws:iam::938998270127:role/NewRelicInfrastructure-Integrations-RemitScout \
NEW_RELIC_STAGING_AWS_MODE=push_pull \
NEW_RELIC_PROD_AWS_MODE=otlp_only \
node ops/newrelic/sync-cloud-links.mjs
```

## Step 4: Verify signal readiness

Staging (account-pinned, required for promotion checks):

```bash
# Run this after a smoke that exercises live staging Plane A/admin routes so New Relic has fresh trace traffic.
NEW_RELIC_TARGET_ENV=staging \
NEW_RELIC_STAGING_AWS_ACCOUNT_ID=010630709504 \
REQUIRE_ACCOUNT_PINNING=1 \
node ops/newrelic/verify-signals.mjs
```

Production (account-pinned, required for promotion checks):

```bash
NEW_RELIC_TARGET_ENV=prod \
NEW_RELIC_PROD_AWS_MODE=otlp_only \
REQUIRE_ACCOUNT_PINNING=0 \
REQUIRE_API_GW_METRICS=0 \
REQUIRE_SQS_METRICS=0 \
node ops/newrelic/verify-signals.mjs
```

Fallback (debug only; can be cross-account noisy in shared New Relic tenants):

```bash
NEW_RELIC_TARGET_ENV=staging node ops/newrelic/verify-signals.mjs
NEW_RELIC_TARGET_ENV=prod node ops/newrelic/verify-signals.mjs
```

The check fails if any required signal group is missing:
- `Metric`
- `Log`
- `Span`
- `AWS/ApiGateway` metrics when the env mode is not `otlp_only`
- `AWS/SQS` metrics when the env mode is not `otlp_only`
- required custom metric families (core SLO/indices)

## Hybrid log model (required)

- Primary (New Relic visibility): application-level async New Relic logs exporter via `NEW_RELIC_INGEST_KEY`.
- Secondary (forensics/audit): unchanged stdout JSON logs to CloudWatch.
- Do not disable CloudWatch logs; New Relic logs are additive, not a replacement.

## Step 5: Workloads and incident routing

If not using full bootstrap:

```bash
NEW_RELIC_ALERT_EMAIL=alerts@remit-scout.com node ops/newrelic/sync-workloads.mjs
NEW_RELIC_ALERT_EMAIL=alerts@remit-scout.com node ops/newrelic/sync-notifications-workflows.mjs
```

Expected workloads:
- `Remit-Scout Global Workload`
- `Remit-Scout STAGING Workload`
- `Remit-Scout PROD Workload`

Expected workflows:
- `Remit-Scout STAGING Incident Workflow`
- `Remit-Scout PROD Incident Workflow`

## Troubleshooting: account mismatch

If `verify-signals` fails with only New Relic integration entities (for example `NewRelic-Delivery-Stream`) and no `remit-scout-*` entities:

1) Verify AWS account receiving New Relic metrics:

```sql
FROM Metric SELECT latest(aws.accountId), uniqueCount(aws.accountId) SINCE 24 hours ago
```

2) Compare to deployment account:

```bash
aws sts get-caller-identity --profile rs-staging
```

If these account IDs differ, New Relic is linked to the wrong AWS account. Re-run the AWS integration install in the correct account and region.

## Promotion rule

Staging/prod promotion must fail if New Relic gate fails. Deploy workflows now run:
1) `bootstrap-dashboards`
2) `sync-alerts`
3) `sync-cloud-links`
4) `verify-signals` (logs + spans required, AWS account pinning only for AWS-linked modes)

Gate placement: before last-known-good image write in deploy workflows.

## Notes

- New Relic alert conditions must not include `SINCE` in NRQL (NerdGraph validation fails).
- Deploy rollback gates remain CloudWatch alarms in `.github/workflows/deploy.yml`.
