---
name: remit-scout-provider-health-probe
description: Verify all 25 remittance providers are healthy — probes running, data fresh, rights-matrix active, no stoplisted providers leaking into production. Use for daily provider audits, incident triage, and pre-release gates.
---

# Remit-Scout Provider Health Probe

## Overview

Systematic health check across all 25 providers. Validates probe execution, data freshness in Silver, rights-matrix status, and stoplist state. Designed to catch silent provider failures before they impact Gold indices or customer-facing data.

## Provider registry (25 active)

remitly, westernunion, worldremit, instarem, wirebarley, alansari, intermex, xoom, xe, transfergo, paysend, pangea, orbitremit, bossmoney, koronapay, remitbee, singx, placid, ria, dahabshiil, sendwave, mukuru, wise, wellsfargo

## Preconditions
- AWS CLI v2 available (for probe Lambda checks)
- Database read access (for Silver/rights-matrix queries)
- `AWS_PROFILE` and `AWS_REGION` set for target environment

## Environment selection

```bash
# Dev
export ENV=dev AWS_PROFILE=rs-dev STACK_PREFIX=remit-scout-dev
export DB_URL="<dev-rds-proxy-endpoint>"

# Staging
export ENV=staging AWS_PROFILE=rs-staging STACK_PREFIX=remit-scout-staging
export DB_URL="<staging-rds-proxy-endpoint>"

# Prod
export ENV=prod AWS_PROFILE=rs-prod STACK_PREFIX=remit-scout-prod
export DB_URL="<prod-rds-proxy-endpoint>"
```

## Checks

### 1. Probe Lambda execution (last 24h)

For each of the 18 provider probe Lambdas:

```bash
for provider in remitly westernunion worldremit instarem wirebarley alansari intermex xoom xe transfergo paysend pangea orbitremit koronapay remitbee ria dahabshiil wise; do
  LAST=$(aws logs filter-log-events \
    --log-group-name "/aws/lambda/${STACK_PREFIX}-probe-${provider}" \
    --start-time $(($(date +%s) - 86400))000 \
    --limit 1 \
    --query 'events[-1].{ts:timestamp,msg:message}' --output text 2>/dev/null)
  echo "${provider}: ${LAST:-NO_RUNS_24H}"
done
```

### 2. Silver data freshness (per provider)

Run against the database:

```sql
SELECT
  p.slug AS provider,
  COUNT(*) AS quotes_24h,
  MAX(qr.created_at) AS latest_quote,
  EXTRACT(EPOCH FROM (NOW() - MAX(qr.created_at))) / 60 AS age_minutes,
  CASE
    WHEN MAX(qr.created_at) > NOW() - INTERVAL '3 hours' THEN 'FRESH'
    WHEN MAX(qr.created_at) > NOW() - INTERVAL '12 hours' THEN 'STALE'
    ELSE 'DEAD'
  END AS status
FROM silver.quote_record qr
JOIN silver.provider p ON p.id = qr.provider_id
WHERE qr.created_at > NOW() - INTERVAL '24 hours'
GROUP BY p.slug
ORDER BY age_minutes DESC;
```

Thresholds:
- **FRESH:** Last quote < 3 hours ago (Tier-2 cadence)
- **STALE:** 3–12 hours (missed cycles)
- **DEAD:** > 12 hours (provider broken or stoplisted)

### 3. Rights-matrix status

```sql
SELECT
  p.slug AS provider,
  rm.status,
  rm.stoplist_status,
  rm.allowed_collect,
  rm.allowed_b2b,
  rm.allowed_b2c,
  rm.allowed_resell_b2b,
  rm.allowed_in_teer,
  rm.allowed_in_rci,
  rm.allowed_in_rvi,
  COUNT(*) AS corridor_count
FROM silver.rights_matrix rm
JOIN silver.provider p ON p.id = rm.provider_id
GROUP BY p.slug, rm.status, rm.stoplist_status,
  rm.allowed_collect, rm.allowed_b2b, rm.allowed_b2c,
  rm.allowed_resell_b2b, rm.allowed_in_teer, rm.allowed_in_rci, rm.allowed_in_rvi
ORDER BY p.slug;
```

Flag: Any provider with `status='production'` but `stoplist_status != 'active'`.

### 4. Provider coverage per tier

```sql
SELECT
  cts.tier,
  COUNT(DISTINCT qr.provider_id) AS active_providers,
  COUNT(DISTINCT cts.corridor_id) AS corridors,
  ROUND(COUNT(DISTINCT qr.provider_id)::numeric / NULLIF(COUNT(DISTINCT cts.corridor_id), 0), 2) AS avg_coverage
FROM silver.corridor_tier_snapshot cts
LEFT JOIN silver.quote_record qr
  ON qr.corridor_id = cts.corridor_id
  AND qr.created_at > NOW() - INTERVAL '24 hours'
WHERE cts.version = 0
GROUP BY cts.tier;
```

SLO: Tier-1 >= 3 providers, Tier-2 >= 3 providers.

### 5. Probe heartbeat alarms

```bash
aws cloudwatch describe-alarms --alarm-name-prefix "${STACK_PREFIX}-probe" \
  --query "MetricAlarms[].{name:AlarmName,state:StateValue}" --output table
```

### 6. Smoke test (API-level)

```bash
SMOKE_BASE_URL="https://api.remit-scout.com" pnpm -C backend ci:integration-smoke
```

## Output template

```
## Provider Health Report — ${ENV}
Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Provider Status (25 total)
| Provider | Probe Last Run | Quotes 24h | Latest Quote Age | Freshness | Rights Status | Stoplist |
(table rows for all 25 providers)

### Summary
- FRESH: <n>/25
- STALE: <n>/25
- DEAD: <n>/25
- Stoplisted (production): <list>
- Missing probes (no Lambda runs): <list>

### Tier Coverage
| Tier | Active Providers | Corridors | Avg Coverage |
(table rows)

### Alarms in ALARM: <list>
### Verdict: ALL_HEALTHY | DEGRADED (<list>) | CRITICAL (<list>)
### Actions needed: (list provider + recommended fix)
```

## When to run
- **Daily (all envs):** Morning health check
- **After B2B sweep cycle:** Confirm providers responded
- **Incident triage:** Identify which providers are down
- **Pre-release gate:** Confirm coverage meets SLOs

## Central report integration

Write B2B output to **Section 2: Provider Health — B2B** and B2C output to **Section 3: Provider Health — B2C** in `ops/reports/daily-ops-report.md`. Split the provider table by `allowed_b2b` vs `allowed_b2c` — the counts will differ per corridor. Update Executive Summary rows accordingly.

## Runbooks
- `docs/runbooks/provider-outage.md`
- `docs/runbooks/indices-readiness.md`
